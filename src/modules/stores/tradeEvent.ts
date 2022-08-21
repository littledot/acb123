import { DbFx, DbOption, DbOptionHistory, DbProfile, DbTradeEvent, DbTradeHistory } from '@m/models/models'
import { Db } from '@m/stores/db'
import * as t from '@m/reportItem'
import * as u from '@m/util'
import money from 'currency.js'
import { DateTime } from "luxon"
import { v4 } from 'uuid'

export type Fx = DbFx

export class Profile {
  tradeHistory: Map<string, TradeHistory>
  tradeReport = <[number, AnnualTradeHistory][]>[]

  constructor() {
    this.tradeHistory = new Map()
  }

  init(db: Db, dbProfile: DbProfile) {
    // debugger
    for (let [security, dbHistory] of Object.entries(dbProfile.tradeHistory)) {
      let history = new TradeHistory()
      history.init(db, dbHistory)
      this.tradeHistory.set(security, history)
    }
  }

  groupByYear() {
    let data = new Map<number, AnnualTradeHistory>()

    let tradeHistory = u.sortIter(this.tradeHistory.entries(), (a, b) => String(a[0]).localeCompare(b[0]))
    for (let [security, history] of tradeHistory) {
      let { stocks, options } = history.groupByYear()

      for (let [year, trades] of stocks) {
        u.mapGetDefault(data, year, () => new AnnualTradeHistory())
          .appendStocks(security, trades)
      }

      for (let [year, trades] of options) {
        u.mapGetDefault(data, year, () => new AnnualTradeHistory())
          .appendOptions(security, trades)
      }

      // Do not group orphans by year
      u.mapGetDefault(data, 0, () => new AnnualTradeHistory())
        .appendOrphan(security, history.orphan)
    }

    return u.sortIter(data.entries(), (a, b) => b[0] - a[0])
  }

  insertTrade(trade: TradeEvent) {
    let history = u.mapGetDefault(this.tradeHistory, trade.security,
      () => new TradeHistory())
    history.insertTrade(trade)
  }

  async calcGains() {
    for (let history of this.tradeHistory.values()) {
      for (let optHistory of history.option.values()) {
        for (let optTrades of optHistory) {
          await t.convertForex(optTrades.trades)
          t.calcGainsForTrades(optTrades.trades, t.OptCalc)
        }
      }
      await t.convertForex(history.stock)
      t.calcGainsForTrades(history.stock, t.StockCalc)
    }

    this.tradeReport = this.groupByYear()
  }

  updateTrade(trade: TradeEvent, oldTrade: t.ReportItem) {
    let old = oldTrade.tradeEvent
    // Complex change? Treat it like a new trade
    if (trade.date !== old.date // Trade date change? Order change
      || trade.security !== old.security  // Security change? Group change
      || trade.optionLot?.id != old.optionLot?.id // Option lot change?
      || trade.action != old.action // Action change?
    ) {
      this.deleteTrade(old)
      this.insertTrade(trade)
      return
    }

    // Replace old trade at same position
    oldTrade.tradeEvent = trade
    oldTrade.tradeValue = oldTrade.acb = oldTrade.optAcb = void 0
  }

  deleteTrade(trade: TradeEvent) {
    this.tradeHistory.get(trade.security)
      ?.let(it => it.deleteTrade(trade))
  }

  clearTrades() {
    this.tradeHistory.clear()
    this.tradeReport = []
  }

  toDbModel() {
    let hist = <any>{}
    for (let [security, history] of this.tradeHistory) {
      hist[security] = history.toDbModel()
    }

    return <DbProfile>{
      tradeHistory: hist,
    }
  }
}

export class AnnualTradeHistory {
  tickerTrades = new Map<string, TickerTradeHistory>()
  tradeCount = 0
  yearGains = money(0)

  appendStocks(ticker: string, trades: t.ReportItem[]) {
    this._getHist(ticker).appendStocks(trades)
    this.yearGains = this.yearGains.add(t.yearGains(trades))
    this.tradeCount += trades.length
  }

  appendOptions(ticker: string, hists: OptionHistory[]) {
    this._getHist(ticker).appendOptions(hists)
    for (let optHist of hists) {
      this.yearGains = this.yearGains.add(t.yearGains(optHist.trades))
      this.tradeCount += optHist.trades.length
    }
  }

  appendOrphan(ticker: string, trades: TradeEvent[]) {
    if (trades.length > 0) {
      this._getHist(ticker).appendOrphan(trades)
      this.tradeCount += trades.length
    }
  }

  _getHist(ticker: string) {
    return u.mapGetDefault(this.tickerTrades, ticker, () => new TickerTradeHistory())
  }
}


export class TickerTradeHistory {
  option: OptionHistory[]
  stock: t.ReportItem[]
  orphan: TradeEvent[]

  tradeCount = 0
  yearGains = money(0)

  constructor() {
    this.option = []
    this.stock = []
    this.orphan = []
  }

  appendStocks(trades: t.ReportItem[]) {
    this.stock.push(...trades)
    this.yearGains = this.yearGains.add(t.yearGains(trades))
    this.tradeCount += trades.length
  }

  appendOptions(optHists: OptionHistory[]) {
    this.option.push(...optHists)
    for (let optHist of optHists) {
      this.yearGains = this.yearGains.add(t.yearGains(optHist.trades))
      this.tradeCount += optHist.trades.length
    }
  }

  appendOrphan(trades: TradeEvent[]) {
    this.orphan.push(...trades)
    this.tradeCount += trades.length
  }
}

export class TradeHistory {
  option: Map<string, OptionHistory[]>
  stock: t.ReportItem[]
  orphan: TradeEvent[]

  constructor() {
    this.option = new Map()
    this.stock = []
    this.orphan = []
  }

  init(db: Db, dbHistory: DbTradeHistory) {
    let cache = new Map<string, t.ReportItem>()

    this.option = dbHistory.option
      .map(it => fromDbOptionHistory(db, cache, it))
      .let(it => u.groupBy(it, it => optionHash(it.contract)))

    this.stock = dbHistory.stock
      .map(it => u.mapGetDefault(cache, it, () => db.readTradeEvent(it)
        ?.let(it => t.newReportRecord2(it))))
      .filter(it => it) as t.ReportItem[]

    this.orphan = dbHistory.orphan
      .map(it => db.readTradeEvent(it))
      .filter(it => it) as TradeEvent[]
  }

  groupByYear() {
    return {
      stocks: u.groupBy(this.stock, it => it.tradeEvent.date.year),
      // orphan: u.groupBy(this.orphan, it => it.date.year),
      options: [...this.option.values()]
        .flatMap(it => it)
        .flatMap(optHist =>
          [...u.groupBy(optHist.trades, it => it.tradeEvent.date.year)
            .entries()]
            .map(([year, trades]) => ({
              y: year,
              h: { ...optHist, trades: trades }
            }))
        )
        .let(it => u.groupBy(it, it => it.y))
        .let(it => u.mapValues(it, it => it.map(it => <OptionHistory>it.h)))
    }
  }

  insertTrade(trade: TradeEvent, optLot?: OptionHistory) {
    let node = t.newReportRecord2(trade)

    optLot
      ?.also(it => { // Move to specific lot?
        t.insertTradeNode(it.trades, node)
        trade.optionLot = it
      })
      // Lot not specified? Find a lot to insert into
      ?? trade.options?.also(it => this._insertOptionTrade(it, node))

    if (!trade.options // No contract? Stock event
      || trade.action == 'exercise') { // Exercise event? Insert to both
      this._insertStockTrade(node)
    }
  }

  _insertOptionTrade(option: Option, node: t.ReportItem): boolean {
    let trade = node.tradeEvent
    let key = optionHash(option)
    let histories = this.option.get(key)
    if (!histories) {
      histories = []
      this.option.set(key, histories)
    }

    if (trade.action == 'buy') { // Buy options? Create new lot
      trade.optionLot = {
        id: v4(),
        contract: option,
        trades: [node],
      }
      histories.push(trade.optionLot)
      return true
    }

    // Sell options? Find a lot to append to
    if (trade.action == 'sell'
      || trade.action == 'exercise') {
      for (let history of histories) {
        // Sell must be after buy
        if (trade.date < history.trades[0]?.tradeEvent.date) {
          continue
        }

        // Lot must have enough shares for sale
        let remainShares = t.sumShares(history.trades)
        if (remainShares < trade.shares) {
          continue
        }

        // Insert trade to lot
        t.insertTradeNode(history.trades, node)
        trade.optionLot = history
        return true
      }

      // Couldn't find any lots? Add to orphan pile
      this.orphan.push(trade)
      return false
    }
    return false
  }

  _insertStockTrade(node: t.ReportItem) {
    t.insertTradeNode(this.stock, node)
    return true
  }

  deleteTrade(trade: TradeEvent) {
    let i = this.stock.findIndex(it => it.tradeEvent.id === trade.id)
    if (i > -1) {
      this.stock.splice(i, 1)
      // Force recalculate acb/cg for new item in its place
      this.stock[i]?.let(it => it.acb = it.optAcb = void 0)
    }

    for (let optHists of this.option.values()) {
      for (let [d, optHist] of optHists.entries()) {
        let i = optHist.trades.findIndex(it => it.tradeEvent.id == trade.id)
        if (i > -1) {
          optHist.trades.splice(i, 1)
          // Force recalculate acb/cg for new item in its place
          optHist.trades[i]?.let(it => it.acb = it.optAcb = void 0)
          // Empty lot? Remove it
          if (optHist.trades.length == 0) {
            optHists.splice(d, 1)
          }
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
      orphan: this.orphan.map(it => it.id),
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
  notes?: string
  raw?: string

  options?: Option
  optionLot?: OptionHistory
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
    notes: json.notes,
    raw: json.raw,
    options: fromDbOption(json.options),
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
    notes: obj.notes,
    raw: obj.raw,
    options: toDbOption(obj.options),
  }
}

export interface Option {
  type: string
  expiryDate: DateTime
  strike: money
  strikeFx: Fx
}

export function optionHash(o: Option) {
  return `${o.strike.value}|${o.type}|${o.expiryDate.toFormat('yyyy-MM-dd')}`
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

export function fromDbOptionHistory(db: Db, cache: Map<string, t.ReportItem>, obj: DbOptionHistory): OptionHistory {
  let r = {
    id: obj.id,
    contract: fromDbOption(obj.contract)!,
  } as OptionHistory

  r.trades = obj.tradeIds.map(it => db.readTradeEvent(it)
    ?.also(it => it.optionLot = r)
  )
    .filter(it => it)
    .map(it => t.newReportRecord2(it!))

  r.trades.forEach(it => cache.set(it.tradeEvent.id, it))

  return r
}
