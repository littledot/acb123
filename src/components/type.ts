import { useFxStore } from '@store/fx'
import { Option, TradeEvent } from '@store/tradeEvent'
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

export function sumShares(trades: ReportItem[]) {
  return trades.reduce((sum, it) => {
    let n = it.tradeEvent.action.let(it => it === 'buy' ? 1 : -1)
    return sum + it.tradeEvent.shares * n
  }, 0)
}

export async function calcGainsForTrades(trades: ReportItem[]) {
  let startIdx = trades.findIndex(it => !it.tradeValue || !it.acb)
  if (startIdx == -1) return // No data missing? No need to recalculate
  let target = trades.slice(startIdx)

  // Find last known good acb & cg
  let initAcb = (startIdx > 0 ? trades[startIdx - 1].acb : null) ?? {
    shares: 0,
    accShares: 0,
    cost: money(0),
    accCost: money(0),
    acb: money(0),
  }
  let initCg = (startIdx > 0 ? trades[startIdx - 1].cg : null) ?? {
    gains: money(0),
    totalGains: money(0),
  }

  target.reduce((acb, it) => {
    let { tradeEvent: tEvent, tradeValue: tValue } = it
    if (!tValue) return acb // No CAD value? Can't calculate ACB

    if (tEvent.action === 'buy') {
      // buy cost = price * shares + outlay
      let cost = tValue.price.multiply(tEvent.shares).add(tValue.outlay)
      it.acb = addToAcb(acb, tEvent.shares, cost)
    }
    if (['sell', 'expire'].includes(tEvent.action)) {
      // sell cost = acb * shares
      let cost = acb.acb.multiply(-tEvent.shares)
      it.acb = addToAcb(acb, -tEvent.shares, cost)
    }

    return it.acb ?? acb
  }, initAcb)

  target.reduce((cg, it) => {
    let { tradeEvent: tEvent, tradeValue: tValue } = it
    if (!tValue) return cg // No CAD value? Can't calculate gains
    if (!it.acb) return cg // No ACB? Can't calculate gains
    if (!['sell', 'expire'].includes(tEvent.action)) return cg // No sale? No gains

    let revenue = tValue.price.multiply(tEvent.shares).subtract(tValue.outlay)
    let gains = revenue.add(it.acb.cost)
    it.cg = addToCapGains(cg, gains)

    return it.cg ?? cg
  }, initCg)
}

export async function convertForex(items: ReportItem[]) {
  for (let it of items) {
    if (it.tradeValue) continue
    let te = it.tradeEvent

    let fxStore = useFxStore()
    let priceForex = await fxStore.getRate(te.priceFx, it.tradeEvent.date)
    let outlayForex = await fxStore.getRate(te.outlayFx, it.tradeEvent.date)

    it.tradeValue = {
      price: te.price.multiply(priceForex),
      priceForex: priceForex,
      outlay: te.outlay.multiply(outlayForex),
      outlayForex: outlayForex,
    }
  }
  return items
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
