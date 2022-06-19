import { ReportItem } from '@comp/type'
import { FxJson, OptionJson, TradeEventJson } from '@models/tradeEventJson'
import money from 'currency.js'
import { DateTime } from "luxon"

export type Fx = FxJson

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
