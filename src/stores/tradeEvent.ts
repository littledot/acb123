import * as t from '@comp/type'
import * as u from '@comp/util'
import { DbFx, DbOption, DbOptionHistory, DbProfile, DbTradeEvent, DbTradeHistory } from '@models/models'
import money from 'currency.js'
import { DateTime } from "luxon"
import { v4 } from 'uuid'
import { Db } from './db'

export type Fx = DbFx

export class Profile {
  tradeHistory: Map<string, TradeHistory>

  constructor() {
    this.tradeHistory = new Map()
  }

  init(db: Db, dbProfile: DbProfile) {
    for (let [security, dbHistory] of Object.entries(dbProfile.tradeHistory)) {
      let history = new TradeHistory()
      history.init(db, dbHistory)
      this.tradeHistory.set(security, history)
    }
  }

  insertTrade(trade: TradeEvent) {
    let history = this.tradeHistory.get(trade.security)
    if (!history) {
      history = new TradeHistory()
      this.tradeHistory.set(trade.security, history)
    }
    history.insertTrade(trade)
  }

  async calcGains() {
    for (let history of this.tradeHistory.values()) {
      for (let optHistory of history.option.values()) {
        for (let optTrades of optHistory) {
          await t.convertForex(optTrades.trades)
          t.calcGainsForTrades(optTrades.trades)
        }
      }
      await t.convertForex(history.stock)
      t.calcGainsForTrades(history.stock)
    }
  }

  updateTrade(trade: TradeEvent, oldTrade: t.ReportItem) {
    trade.options
      ?.also(it => this._updateOptionTrade(trade, oldTrade))
      ?? this._updateStockTrade(trade, oldTrade)
  }

  _updateStockTrade(trade: TradeEvent, oldTrade: t.ReportItem) {
    let old = oldTrade.tradeEvent
    // Security or date change? Treat it like a new trade
    if (trade.date !== old.date ||
      trade.security !== old.security) {
      this.deleteTrade(old)
      this.insertTrade(trade)
      return
    }

    // Replace old trade at same position
    oldTrade.tradeEvent = trade
    oldTrade.tradeValue = undefined
  }

  _updateOptionTrade(trade: TradeEvent, oldTrade: t.ReportItem) {

  }

  deleteTrade(trade: TradeEvent) {
    for (let histories of this.tradeHistory.values()) {
      if (histories.deleteTrade(trade)) return
    }
  }

  clearTrades() {
    this.tradeHistory.clear()
  }

  toDbModel() {
    let th = <any>{}
    for (let [security, history] of this.tradeHistory) {
      th[security] = history.toDbModel()
    }

    return <DbProfile>{
      tradeHistory: th,
    }
  }
}

export class TradeHistory {
  option: Map<string, OptionHistory[]>
  stock: t.ReportItem[]
  unsure: TradeEvent[]

  constructor() {
    this.option = new Map()
    this.stock = []
    this.unsure = []
  }

  init(db: Db, dbHistory: DbTradeHistory) {
    this.option = dbHistory.option
      .map(it => fromDbOptionHistory(db, it))
      .let(it => u.groupBy(it, it => this._optionKey(it.contract)))

    this.stock = dbHistory.stock
      .map(it => db.readTradeEvent(it))
      .filter(it => it)
      .map(it => t.newReportRecord2(it!!))

    this.unsure = dbHistory.stock
      .map(it => db.readTradeEvent(it))
      .filter(it => it)
      .map(it => it!!)
  }

  insertTrade(trade: TradeEvent) {
    trade.options
      ?.also(it => this._insertOptionTrade(it, trade))
      ?? this._insertStockTrade(trade)
  }

  _optionKey(option: Option) {
    return Object.values(option).join('|')
  }

  _insertOptionTrade(option: Option, trade: TradeEvent) {
    let key = this._optionKey(option)
    let histories = this.option.get(key)
    if (!histories) {
      histories = []
      this.option.set(key, histories)
    }

    if (trade.action == 'buy') { // Buy options? Create new lot
      histories.push({
        id: v4(),
        contract: option,
        trades: [t.newReportRecord2(trade)],
      })
      return
    }

    // Sell options? Find a lot to append to
    if (trade.action == 'sell') {
      for (let history of histories) {
        // Sell must be after buy
        if (trade.date < history.trades[0]?.tradeEvent.date) {
          continue
        }

        // Lot must have enough shares for sale
        let remainShares = history.trades.reduce(
          (sum, it) => sum + (it.tradeEvent.action === 'buy' ? it.tradeEvent.shares : -it.tradeEvent.shares), 0
        )
        if (remainShares < trade.shares) {
          continue
        }

        // Insert trade to lot
        this._insertTrade(history.trades, trade)
        return
      }

      // Couldn't find any lots? Add to unsure pile
      this.unsure.push(trade)
      return
    }
  }

  _insertStockTrade(trade: TradeEvent) {
    this._insertTrade(this.stock, trade)
  }

  _insertTrade(trades: t.ReportItem[], trade: TradeEvent) {
    let it = t.newReportRecord2(trade)

    if (trades.length === 0) {
      trades.push(it)
      return
    }

    for (let i = trades.length - 1; i >= 0; i--) {
      if (trade.date >= trades[i].tradeEvent.date) {
        trades.splice(i + 1, 0, it)
        return
      }
    }
  }

  deleteTrade(trade: TradeEvent) {
    let i = this.stock.findIndex(it => it.tradeEvent.id === trade.id)
    if (i > -1) {
      this.stock.splice(i, 1)
      return true
    }

    for (let optHists of this.option.values()) {
      for (let optHist of optHists) {
        let i = optHist.trades.findIndex(it => it.tradeEvent.id == trade.id)
        if (i > -1) {
          optHist.trades.splice(i, 1)
          return true
        }
      }
    }

    return false
  }

  toDbModel() {
    let options = <DbOptionHistory[]>[]
    for (let history of this.option.values()) {
      let vals = history.map(it => toDbOptionHistory(it)!!)
      options.push(...vals)
    }

    return <DbTradeHistory>{
      option: options,
      stock: this.stock.map(it => it.tradeEvent.id),
      uncategorized: this.unsure.map(it => it.id),
    }
  }
}

export interface TradeEvent {
  id: string
  security: string
  date: DateTime // trade date
  settleDate: DateTime
  action: string
  shares: number
  price: money
  priceFx: Fx
  outlay: money
  outlayFx: Fx
  raw?: string

  options?: Option
}

export function fromDbTradeEvent(json: DbTradeEvent): TradeEvent {
  return {
    id: json.id,
    security: json.security,
    date: DateTime.fromJSDate(json.date),
    settleDate: DateTime.fromJSDate(json.settleDate),
    action: json.action,
    shares: json.shares,
    price: money(json.price),
    priceFx: json.priceFx,
    outlay: money(json.outlay),
    outlayFx: json.outlayFx,
    options: fromDbOption(json.options),
    raw: json.raw,
  }
}

export function toDbTradeEvent(obj: TradeEvent): DbTradeEvent {
  return {
    id: obj.id,
    security: obj.security,
    date: obj.date.toJSDate(),
    settleDate: obj.settleDate.toJSDate(),
    action: obj.action,
    shares: obj.shares,
    price: obj.price.value,
    priceFx: obj.priceFx,
    outlay: obj.outlay.value,
    outlayFx: obj.outlayFx,
    options: toDbOption(obj.options),
    raw: obj.raw,
  }
}

export interface Option {
  type: string
  expiryDate: DateTime
  strike: money
  strikeFx: Fx
}

export function fromDbOption(json?: DbOption) {
  return json ? <Option>{
    type: json.type,
    expiryDate: DateTime.fromJSDate(json.expiryDate),
    strike: money(json.strike),
    strikeFx: json.strikeFx,
  } : undefined
}

export function toDbOption(obj?: Option) {
  return obj ? <DbOption>{
    type: obj.type,
    expiryDate: obj.expiryDate.toJSDate(),
    strike: obj.strike.value,
    strikeFx: obj.strikeFx,
  } : undefined
}

export interface OptionHistory {
  id: string
  contract: Option
  trades: t.ReportItem[]
}

export function toDbOptionHistory(obj?: OptionHistory) {
  return obj ? <DbOptionHistory>{
    id: obj.id,
    contract: toDbOption(obj.contract),
    tradeIds: obj.trades.map(it => it.tradeEvent.id),
  } : undefined
}

export function fromDbOptionHistory(db: Db, obj: DbOptionHistory): OptionHistory {
  return {
    id: obj.id,
    contract: fromDbOption(obj.contract)!!,
    trades: obj.tradeIds.map(it => db.readTradeEvent(it))
      .filter(it => it)
      .map(it => t.newReportRecord2(it!!))
  }
}
