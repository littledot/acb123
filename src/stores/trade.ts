import * as t from '@comp/type'
import * as u from '@comp/util'
import money from 'currency.js'
import Papa, { ParseResult } from "papaparse"
import { defineStore } from "pinia"
import { v4 as uuid } from 'uuid'
import { useFxStore } from './fx'
import { fromTradeEventJson, TradeEvent } from './tradeEvent'
import { Convert as TradeEventIdsConverter } from './tradeEventIdsJson'
import { Convert as TradeEventConverter } from './tradeEventJson'


export const useTradeStore = defineStore('TradeStore', {
  state: () => ({
    rawTrades: new Map<string, TradeEvent>(),
    trades: <t.ReportItem[]>[],
  }),
  getters: {
    tradesBySecurity: (state) => {
      let map = u.groupBy(state.trades, (it) => it.tradeEvent.security)
      return new Map([...map].sort((a, b) => String(a[0]).localeCompare(b[0])))
    }
  },
  actions: {
    async init() {
      // Load trade index
      let idsStr = localStorage.getItem('tradeIds') ?? ''
      let ids = TradeEventIdsConverter.toTradeEventIds(idsStr)
      console.log(`loading ${ids.length} trades from ls.index`)

      // Load trade events
      let fails = 0
      ids.forEach((id) => {
        try {
          let tradeStr = localStorage.getItem(id) ?? ''
          let tradeJson = TradeEventConverter.toTradeEventJson(tradeStr)
          let trade = fromTradeEventJson(tradeJson)
          this.rawTrades.set(trade.id, trade)
        } catch (err) {
          fails++
        }
      })
      console.log(`${fails} trades failed to load`)

      await this._calcGains()
    },

    async updateTrade(newTrade: t.TradeEvent) {
      this.rawTrades.set(newTrade.id, newTrade)

      this._calcGains()
    },

    importCsvFile(file: File | string) {
      Papa.parse(file, {
        download: true,
        transform: (s) => s.trim(),
        complete: this._onParseCsv,
      })
    },

    // private

    _persistTrade(trade: t.TradeEvent) {
      // Index trade for processing
      this.rawTrades.set(trade.id, trade)

      // Save trade to localStorage
      let json = JSON.stringify(trade)
      localStorage.setItem(trade.id, json)
      console.log('persisted trade event', json)

      // Save trade index to localStorage
      let ids = new Set(this.rawTrades.keys()).add(trade.id)
      localStorage.setItem('tradeIds', JSON.stringify([...ids]))
    },

    _onParseCsv(results: ParseResult<string[]>) {
      cleanData(results)
        .forEach((it) => this._persistTrade(it)) // Insert new trades

      this._calcGains()
    },

    async _calcGains() {
      this.trades = Array.from(this.rawTrades.values())
        .sort((a, b) => a.date.toMillis() - b.date.toMillis()) // Order by date
        .map(it => t.newReportRecord2(it))

      calcGains(this.trades)

      await convertForex(this.trades)
      calcGains(this.trades)
    }
  }
})

function cleanData(results: ParseResult<string[]>) {
  let trades = results.data
    .slice(1)
    .filter(row => row.length > 16)
    .map((row, i) => t.newQuestradeEvent(uuid(), row))
    .map(it => t.newTradeEvent(it))
  return trades
}

async function convertForex(items: t.ReportItem[]) {
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

function calcGains(items: t.ReportItem[]) {
  let events = u.groupBy(items, it => it.tradeEvent.security)

  events.forEach(it => {
    it.reduce((acb, it) => {
      let val = it.tradeValue
      if (!val) return acb // No CAD value? Can't calculate ACB

      if (it.tradeEvent.action === 'buy') {
        // buy cost = price * shares + outlay
        let cost = val.price.multiply(it.tradeEvent.shares).add(val.outlay)
        it.acb = t.addToAcb(acb, it.tradeEvent.shares, cost)
      }
      if (it.tradeEvent.action === 'sell') {
        if (it.tradeEvent.shares == acb.shares) { // Sold all shares? Zero-out acb
          it.acb = t.addToAcb(acb, -it.tradeEvent.shares, acb.cost.multiply(-1))
        } else { // Sold partial? Cost = acb * shares
          let cost = acb.acb.multiply(-it.tradeEvent.shares)
          it.acb = t.addToAcb(acb, -it.tradeEvent.shares, cost)
        }
      }

      return it.acb ?? acb
    }, {
      shares: 0,
      cost: money(0),
      totalCost: money(0),
      acb: money(0),
    })

    it.reduce((cg, it) => {
      let val = it.tradeValue
      if (!val) return cg // No CAD value? Can't calculate gains
      if (!it.acb) return cg // No ACB? Can't calculate gains
      if (it.tradeEvent.action !== 'sell') return cg // No sale? No gains

      let rev = val.price.multiply(it.tradeEvent.shares).subtract(val.outlay)
      let gains = rev.add(it.acb.cost)
      it.cg = t.addToCapGains(cg, gains)

      return it.cg ?? cg
    }, {
      gains: money(0),
      totalGains: money(0),
    })
  })

  return events
}
