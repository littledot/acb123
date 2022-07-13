import { ReportItem } from '@comp/type'
import { FxJson, OptionJson, ProfileJson, TradeEventJson } from '@models/models'
import money from 'currency.js'
import { DateTime } from "luxon"

export type Fx = FxJson

export class Profile {
  tradeEvents: Map<string, TradeEvent[]>

  constructor() {
    this.tradeEvents = new Map()
  }

  _getTrades(security: string) {
    let events = this.tradeEvents.get(security)
    if (!events) {
      events = []
      this.tradeEvents.set(security, events)
    }
    return events
  }

  appendTrade(event: TradeEvent) {
    let events = this._getTrades(event.security)
    events.push(event)
  }

  insertTrade(event: TradeEvent) {
    let events = this._getTrades(event.security)

    if (events.length == 0) {
      events.push(event)
      return
    }

    for (let i = events.length - 1; i >= 0; i--) {
      if (event.date >= events[i].date) {
        events.splice(i + 1, 0, event)
        break
      }
    }
  }

  updateTrade(trade: TradeEvent, old: TradeEvent) {
    // Security or Date change? Treat it like a new trade
    if (trade.date !== old.date ||
      trade.security !== old.security) {
      this.deleteTrade(old)
      this.insertTrade(trade)
      return
    }

    // Replace old trade at same position
    let trades = this._getTrades(old.security)
    let i = trades.indexOf(old)
    if (i > -1) {
      trades.splice(i, 1, trade)
    }
  }

  deleteTrade(trade: TradeEvent) {
    let trades = this._getTrades(trade.security)
    let i = trades.indexOf(trade)
    if (i > -1) {
      trades.splice(i, 1)
    }
  }

  clearTrades() {
    this.tradeEvents.clear()
  }

  toProfileJson() {
    let tradeIds = <any>{}
    for (let [security, events] of this.tradeEvents) {
      tradeIds[security] = events.map(it => it.id)
    }
    return <ProfileJson>{
      tradeIds: tradeIds,
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

  options?: Options
}

export function fromTradeEventJson(json: TradeEventJson): TradeEvent {
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
    options: fromOptionJson(json.options),
  }
}

export interface Options {
  type: string
  expiryDate: DateTime
  strike: money
  strikeFx: Fx
}

export function fromOptionJson(json?: OptionJson) {
  return json ? <Options>{
    type: json.type,
    expiryDate: DateTime.fromJSDate(json.expiryDate),
    strike: money(json.strike),
    strikeFx: json.strikeFx,
  } : undefined
}


export interface TradeHistory {
  option: Map<Options, TradeEventLots>,
  stock: ReportItem[],
}

export interface TradeEventLots {
  lots: TradeEventLot[],
  unsure: ReportItem[],
}

export interface TradeEventLot {
  trades: ReportItem[],
  accShares: number,
}
