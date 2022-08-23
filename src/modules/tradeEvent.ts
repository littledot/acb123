import { DbFx, DbOption, DbOptionHistory, DbTradeEvent, DbTradeHistory } from '@m/models/models'
import { Db } from '@m/stores/db'
import * as t from '@/modules/tradeNode'
import * as u from '@m/util'
import money from 'currency.js'
import { DateTime } from "luxon"
import { v4 } from 'uuid'

export type Fx = DbFx

export class AnnualTradeHistory {
  tickerTrades = new Map<string, TickerTradeHistory>()
  tradeCount = 0
  yearGains = money(0)

  appendStocks(ticker: string, trades: t.TradeNode[]) {
    this._getHist(ticker).appendStocks(trades)
    this.yearGains = this.yearGains.add(t.yearGains(trades))
    this.tradeCount += trades.length
  }

  appendOptions(ticker: string, lots: OptionLot[]) {
    this._getHist(ticker).appendOptions(lots)
    for (let optHist of lots) {
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
  option: OptionLot[]
  stock: t.TradeNode[]
  orphan: TradeEvent[]

  tradeCount = 0
  yearGains = money(0)

  constructor() {
    this.option = []
    this.stock = []
    this.orphan = []
  }

  appendStocks(trades: t.TradeNode[]) {
    this.stock.push(...trades)
    this.yearGains = this.yearGains.add(t.yearGains(trades))
    this.tradeCount += trades.length
  }

  appendOptions(lots: OptionLot[]) {
    this.option.push(...lots)
    for (let lot of lots) {
      this.yearGains = this.yearGains.add(t.yearGains(lot.trades))
      this.tradeCount += lot.trades.length
    }
  }

  appendOrphan(trades: TradeEvent[]) {
    this.orphan.push(...trades)
    this.tradeCount += trades.length
  }
}

export class TradeHistory {
  option = new Map<string, OptionLot[]>()
  stock = [] as t.TradeNode[]
  orphan = [] as TradeEvent[]


  init(db: Db, dbHistory: DbTradeHistory) {
    let cache = new Map<string, t.TradeNode>()

    this.option = dbHistory.option
      .map(it => fromDbOptionHistory(db, cache, it))
      .let(it => u.groupBy(it, it => optionHash(it.contract)))

    this.stock = dbHistory.stock
      .map(it => u.mapGetDefault(cache, it, () => db.readTradeEvent(it)
        ?.let(it => t.newTradeNode(it))))
      .filter(it => it) as t.TradeNode[]

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
              l: { ...optHist, trades: trades }
            }))
        )
        .let(it => u.groupBy(it, it => it.y))
        .let(it => u.mapValues(it, it => it.map(it => <OptionLot>it.l)))
    }
  }

  insertTrade(trade: TradeEvent) {
    let node = t.newTradeNode(trade)

    // option event? Insert into option lot
    if (trade.optionLot?.id == 'new') {
      this._insertOptionTrade(trade.optionLot.contract, node)
    } else if (trade.optionLot) {
      t.insertTradeNode(trade.optionLot.trades, node)
    }

    // stock or exercise event? Insert into stock lot
    if (!trade.optionLot || trade.action == 'exercise') {
      t.insertTradeNode(this.stock, node)
    }
  }

  _insertOptionTrade(option: Option, node: t.TradeNode): boolean {
    let trade = node.tradeEvent
    let key = optionHash(option)
    let histories = u.mapGetDefault(this.option, key, () => [])

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

  optionLot?: OptionLot
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
    options: toDbOption(obj.optionLot?.contract),
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
  } : void 0
}

export function toDbOption(obj?: Option) {
  return obj ? <DbOption>{
    type: obj.type,
    expiryDate: obj.expiryDate.toJSDate(),
    strike: obj.strike.value,
    strikeFx: obj.strikeFx,
  } : void 0
}

export interface OptionLot {
  id: string
  contract: Option
  trades: t.TradeNode[]
}

export function toDbOptionHistory(obj?: OptionLot) {
  return obj ? <DbOptionHistory>{
    id: obj.id,
    contract: toDbOption(obj.contract),
    tradeIds: obj.trades.map(it => it.tradeEvent.id),
  } : void 0
}

export function fromDbOptionHistory(db: Db, cache: Map<string, t.TradeNode>, obj: DbOptionHistory): OptionLot {
  let r = {
    id: obj.id,
    contract: fromDbOption(obj.contract)!,
  } as OptionLot

  r.trades = obj.tradeIds.map(it => db.readTradeEvent(it)
    ?.also(it => it.optionLot = r)
  )
    .filter(it => it)
    .map(it => t.newTradeNode(it!))

  r.trades.forEach(it => cache.set(it.tradeEvent.id, it))

  return r
}