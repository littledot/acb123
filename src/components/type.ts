import { Options, TradeEvent } from '@store/tradeEvent'
import axios from 'axios'
import money from 'currency.js'
import { capitalize } from 'lodash'
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
  options?: {
    type: string
    expiryDate: DateTime
    strike: money
  }
  raw: string
}

// https://regex101.com/r/3pWM5r/latest
const optionsRegex = /^(PUT|CALL) \.?(\w+) (\d{2}\/\d{2}\/\d{2}) (\d*(?:,\d{3})*\.?\d*),/i

export function newQuestradeEvent(id: string, csv: string[]): QuestradeEvent {
  let o = {
    id: id,
    date: DateTime.fromFormat(csv[1], 'dd-MM-yy'),
    settleDate: DateTime.fromFormat(csv[2], 'dd-MM-yy'),
    action: csv[4].toLowerCase(),
    quantity: u.parseNumber(csv[5]),
    price: money(u.parseNumber(csv[10])),
    commFees: money(-u.parseNumber(csv[12])), // flip to positive
    secFees: money(-u.parseNumber(csv[13])), // flip to positive
    raw: csv.join(',')
  } as QuestradeEvent

  o.currency = CAD
  if (csv[0].startsWith(`U.S.`)) {
    o.currency = USD
  }

  let desc = csv[7]
  let optionsMatch = optionsRegex.exec(desc)
  if (optionsMatch) {
    let [_, optType, symbol, rawExpiration, rawStrike] = optionsMatch
    o.symbol = symbol
    // o.action += capitalize(optType) // buyCall, sellPut, etc.
    o.quantity *= 100
    o.options = {
      type: optType.toLowerCase(),
      expiryDate: DateTime.fromFormat(rawExpiration, 'MM/dd/yy'),
      strike: money(u.parseNumber(rawStrike)),
    }
    console.log(o)
  } else {
    o.symbol = csv[6] ? csv[6] :
      desc.startsWith(`HORIZONS U S DLR CURRENCY`) ? 'DLR' :
        desc.replace(`, AVG PRICE - ASK US FOR DETAILS`, '')
  }

  if (o.symbol.startsWith('.')) { // Remove . from CAD symbols
    o.symbol = o.symbol.slice(1)
  }

  return o
}

export interface ReportItem {
  tradeEvent: TradeEvent
  tradeValue?: TradeValue // CAD
  acb?: Acb
  cg?: CapGains
  warn: string[]
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
    warn: [],
  }
}

export function newReportRecord2(te: TradeEvent) {
  return <ReportItem>{
    tradeEvent: te,
    warn: [],
  }
}

export interface Fx {
  currency: string
  rate: number
}

export function newTradeEvent(event: QuestradeEvent) {
  let fx = { currency: event.currency.forexCode, rate: -1 }
  return {
    id: event.id,
    security: event.symbol,
    date: event.date,
    settleDate: event.settleDate,
    action: event.action,
    shares: event.quantity,
    price: event.price,
    priceFx: fx,
    outlay: event.commFees.add(event.secFees),
    outlayFx: fx,
    options: event.options?.let(it => Object.assign({ strikeFx: fx }, it)),
    raw: event.raw,
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
  accShares: number
  cost: money
  accCost: money
  acb: money
}

export function addToAcb(acb: Acb, shares: number, cost: money) {
  let newShares = acb.accShares + shares
  // Sold all shares? Zero-out acb
  let newCost = newShares === 0 ? acb.accCost.multiply(-1) : cost
  let newAccCost = acb.accCost.add(newCost)
  return {
    shares: shares,
    accShares: newShares,
    cost: newCost,
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
