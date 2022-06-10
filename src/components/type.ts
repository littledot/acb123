import { TradeEvent } from '@store/tradeEvent'
import axios from 'axios'
import money from 'currency.js'
import { DateTime } from 'luxon'
import * as u from './util'

export interface Currency extends money.Options {
  forexCode: string
}

export const CAD = { forexCode: 'CAD', symbol: "$", precision: 2 }
export const USD = { forexCode: 'USD', symbol: "US$", precision: 2 }

export interface QuestradeEvent {
  id: string
  symbol: string
  date: DateTime // trade date
  settleDate: DateTime
  action: string
  quantity: number
  currency: Currency
  price: money
  commFees: money
  secFees: money
  desc: string
}

export function newQuestradeEvent(id: string, csv: string[]): QuestradeEvent {
  id = id

  let rawDate = csv[1].split('-').map(x => +x) // dd-mm-yy
  let rawDate2 = csv[2].split('-').map(x => +x)

  let currency = CAD
  if (csv[0].startsWith(`U.S.`)) {
    currency = USD
  }

  let desc = csv[7].replace(`, AVG PRICE - ASK US FOR DETAILS`, ``)

  let symbol = csv[6]
  if (csv[7].startsWith(`HORIZONS U S DLR CURRENCY`)) {
    symbol = `DLR`
  }
  if (!symbol) { // No symbol? Use desc
    symbol = desc
  }
  symbol = symbol
  if (symbol.startsWith('.')) { // Remove . from CAD trades
    symbol = symbol.slice(1)
  }

  return {
    id: id,
    date: DateTime.local(2000 + rawDate[2], rawDate[1], rawDate[0]),
    settleDate: DateTime.local(2000 + rawDate2[2], rawDate2[1], rawDate2[0]),
    currency: currency,
    desc: desc,
    symbol: symbol,
    action: csv[4].toLowerCase(),
    quantity: u.parseNumber(csv[5]),
    price: money(u.parseNumber(csv[10])),
    commFees: money(-u.parseNumber(csv[12])), // flip to positive
    secFees: money(-u.parseNumber(csv[13])), // flip to positive
  }
}

export interface ReportItem {
  tradeEvent: TradeEvent
  tradeValue?: TradeValue // CAD
  acb?: Acb
  cg?: CapGains
}

export function newReportRecord(event: QuestradeEvent) {
  let te = newTradeEvent(event)
  let tv = event.currency === CAD ? {
    price: te.price,
    priceForex: 1,
    outlay: te.outlay,
    outlayForex: 1,
  } : null

  return <ReportItem>{
    tradeEvent: te,
    tradeValue: tv,
  }
}

export function newReportRecord2(te: TradeEvent) {
  return <ReportItem>{
    tradeEvent: te,
  }
}

export interface Fx {
  currency: string
  rate: number
}

export function newTradeEvent(event: QuestradeEvent) {
  return {
    id: event.id,
    security: event.symbol,
    date: event.date,
    settleDate: event.settleDate,
    action: event.action,
    shares: event.quantity,
    price: event.price,
    priceFx: { currency: event.currency.forexCode, rate: -1 },
    outlay: event.commFees.add(event.secFees),
    outlayFx: { currency: event.currency.forexCode, rate: -1 },
  }
}

export interface TradeValue {
  price: money
  priceForex: number
  outlay: money
  outlayForex: number
}

export interface Acb {
  shares: number
  cost: money
  accCost: money
  acb: money
}

export function zeroOutAcb(acb: Acb) {
  return {
    shares: 0,
    cost: acb.accCost.multiply(-1),
    accCost: money(0),
    acb: money(0),
  }
}

export function addToAcb(acb: Acb, shares: number, cost: money) {
  let newShares = acb.shares + shares
  let newAccCost = acb.accCost.add(cost)
  return {
    shares: newShares,
    cost: cost,
    accCost: newAccCost,
    acb: newShares === 0 ? money(0) : newAccCost.divide(newShares),
  }
}

export interface CapGains {
  gains: money
  totalGains: money
}

export function addToCapGains(cg: CapGains, gains: money) {
  return {
    gains: gains,
    totalGains: cg.totalGains.add(gains)
  }
}
