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
    lsNamespace: ['default'],
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
    async clear() {
      this.rawTrades.clear()

      Object.keys(localStorage)
        .filter(it => it.startsWith(this._lsKey()))
        .forEach(it => localStorage.removeItem(it))

      await this._calcGains()
    },

    async init() {
      // Load trade index from ls
      let idsStr = localStorage.getItem(this._lsKey('tradeIds')) ?? '[]'
      let ids = TradeEventIdsConverter.toTradeEventIds(idsStr)
      console.log(`loading ${ids.length} trades from ls.index`)

      // Load trade events from ls
      let fails = 0
      ids.forEach((id) => {
        try {
          let tradeStr = localStorage.getItem(this._lsKey('trade', id)) ?? ''
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

    async updateTrade(trade: TradeEvent) {
      this._persistTrade(trade)

      await this._calcGains()
    },

    async deleteTrade(trade: TradeEvent) {
      this.rawTrades.delete(trade.id)

      // Delete trade from ls
      localStorage.removeItem(this._lsKey('trade', trade.id))

      // Delete trade index from ls
      let ids = new Set(this.rawTrades.keys())
      localStorage.setItem(this._lsKey('tradeIds'), JSON.stringify([...ids]))

      await this._calcGains()
    },

    importCsvFile(file: File | string) {
      Papa.parse(file, {
        download: true,
        transform: (s) => s.trim(),
        complete: this._onParseCsv,
      })
    },

    // private

    _lsKey(...keys: string[]) {
      return this.lsNamespace.concat(keys).join('|')
    },

    _persistTrade(trade: TradeEvent) {
      // Index trade for processing
      this.rawTrades.set(trade.id, trade)

      // Save trade to localStorage
      let json = JSON.stringify(trade)
      localStorage.setItem(this._lsKey('trade', trade.id), json)
      console.log('persisted trade event', json)

      // Save trade index to localStorage
      let ids = new Set(this.rawTrades.keys()).add(trade.id)
      localStorage.setItem(this._lsKey('tradeIds'), JSON.stringify([...ids]))
    },

    async _onParseCsv(results: ParseResult<string[]>) {
      cleanData(results)
        .forEach((it) => this._persistTrade(it)) // Insert new trades

      await this._calcGains()
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
    // .filter((it) => it.symbol === 'DLR') // debugging
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
        if (it.tradeEvent.shares === acb.shares) { // Sold all shares? Zero-out acb
          let cost = acb.accCost.multiply(-1)
          it.acb = t.addToAcb(acb, -it.tradeEvent.shares, cost)
        } else { // Sold partial? Cost = acb * shares
          let cost = acb.acb.multiply(-it.tradeEvent.shares)
          it.acb = t.addToAcb(acb, -it.tradeEvent.shares, cost)
        }
      }

      return it.acb ?? acb
    }, {
      shares: 0,
      cost: money(0),
      accCost: money(0),
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
