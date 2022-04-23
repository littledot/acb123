import { DateTime } from "luxon"
import * as u from './util'
import axios from 'axios'
import { unwatchFile } from "fs";

export class TradeEvent {
  id: string
  symbol: string
  date: DateTime
  action: string
  quantity: number
  currency: string
  price: number
  commFees: number // negative
  secFees: number // negative
  desc: string

  matchedEvents: TradeEventMatch[] = [];

  constructor(id: string, csv: string[]) {
    this.id = id

    let rawDate = csv[1].split("-").map(x => +x) // dd-mm-yy
    this.date = DateTime.local(2000 + rawDate[2], rawDate[1], rawDate[0])

    let currency = `?`
    if (csv[0].startsWith(`U.S.`)) {
      currency = `USD`
    } else if (csv[0].startsWith(`Canadian`)) {
      currency = `CAD`
    }
    this.currency = currency

    this.desc = csv[7].replace(`, AVG PRICE - ASK US FOR DETAILS`, ``)

    let symbol = csv[6]
    if (csv[7].startsWith(`HORIZONS U S DLR CURRENCY`)) {
      symbol = `.DLR`
    }
    if (!symbol) {
      symbol = this.desc
    }
    this.symbol = symbol

    this.action = csv[4].toLowerCase()
    this.quantity = u.parseNumber(csv[5])
    this.price = u.parseNumber(csv[10])
    this.commFees = u.parseNumber(csv[12])
    this.secFees = u.parseNumber(csv[13])
  }

  unmatchedQuantity() {
    let matched = this.matchedEvents.reduce((sum, it) => sum + it.quantity, 0)
    return this.quantity - matched
  }

  matchDisposition(event: TradeEvent) {
    if (this.action === event.action) { // Same action? No disposition
      return
    }
    if (this.symbol !== event.symbol) { // Diff symbols? No disposition
      return
    }
    if (event.unmatchedQuantity() <= 0) { // No more shares to dispose?
      return
    }

    let matchQuantity = Math.min(this.unmatchedQuantity(), event.unmatchedQuantity())

    this.matchedEvents.push(new TradeEventMatch(event, matchQuantity))
    event.matchedEvents.push(new TradeEventMatch(this, matchQuantity))
  }

  gross() {
    return this.price * this.quantity + this.commFees + this.secFees
  }
}


export class TradeEventMatch {
  tradeEvent: TradeEvent;
  quantity: number;

  constructor(tradeEvent: TradeEvent, quantity: number) {
    this.tradeEvent = tradeEvent
    this.quantity = quantity
  }

  gross() {
    return this.tradeEvent.gross() * this.quantity / this.tradeEvent.quantity
  }
}

export class Forex {
  boc: Map<number, BocForexObs> = new Map();

  async loadBoc(...years: number[]) {
    for (let year of years) {
      let url = `https://littledot.github.io/bank-of-canada-exchange-rates/data/out/boc_${year}.full.json`
      let res = await axios.get(url)

      this.boc.set(year, res.data.observations)
      console.log(`loaded boc forex`, year, res.data)
    }
  }

  getBocRate(currency: string, date: DateTime): number {
    if (currency == 'CAD') return 1

    let code = `FX${currency}CAD`
    let rate = this.boc.get(date.year)?.[code]?.[date.toISODate()]
    if (rate) {
      return parseFloat(rate)
    }
    return NaN
  }

  getBocRateByTrade(trade: TradeEvent) {
    return this.getBocRate(trade.currency, trade.date)
  }
}

export interface BocForexObs {
  [currencyCode: string]: BocForexRate
}

export interface BocForexRate {
  [date: string]: string
}
