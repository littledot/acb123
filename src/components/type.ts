import { DateTime } from 'luxon'
import money from 'currency.js'
import * as u from './util'
import axios from 'axios'

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
  totalCost: money
  acb: money
}


export function addToAcb(acb: Acb, shares: number, cost: money) {
  let newShares = acb.shares + shares
  let newCost = acb.cost.add(cost)
  return {
    shares: newShares,
    cost: cost,
    totalCost: newCost,
    acb: newShares === 0 ? money(0) : newCost.divide(newShares),
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


export class Forex {
  boc: Map<number, BocForexObs> = new Map();

  async loadBocs(...years: number[]) {
    for (let year of years) {
      this.loadBoc(year)
    }
  }

  async loadBoc(year: number) {
    let url = `https://littledot.github.io/bank-of-canada-exchange-rates/data/out/boc_${year}.full.json`
    let res = await axios.get(url)

    this.boc.set(year, res.data.observations)
    console.log(`loaded boc forex`, year, res.data)
    return <BocForexObs>res.data.observations
  }

  async getRatesByYear(date: DateTime) {
    let rates = this.boc.get(date.year)
    if (rates) return rates

    return await this.loadBoc(date.year)
  }

  async getRate(fx: Fx, date: DateTime) {
    if (fx.currency === 'custom') return fx.rate
    return this.getRate2(fx.currency, date)
  }

  async getRate2(currency: string, date: DateTime) {
    if (currency === 'CAD') return 1

    let code = `FX${currency}CAD`
    let rates = await this.getRatesByYear(date)
    let rate = rates[code]?.[date.toISODate()]
    if (rate) {
      return parseFloat(rate)
    }
    return NaN
  }
}

export interface BocForexObs {
  [currencyCode: string]: BocForexRate
}

export interface BocForexRate {
  [date: string]: string
}
