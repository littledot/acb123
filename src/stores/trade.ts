import { TradeValue } from './../components/type'
import { Options } from './tradeEventJson'
import * as t from '@comp/type'
import * as u from '@comp/util'
import { useFxStore } from '@store/fx'
import { fromTradeEventJson, TradeHistory, TradeEvent, TradeEventLot, TradeEventLots } from '@store/tradeEvent'
import { Convert as TradeEventIdsConverter } from '@store/tradeEventIdsJson'
import { Convert as TradeEventConverter } from '@store/tradeEventJson'
import money from 'currency.js'
import Papa, { ParseResult } from "papaparse"
import { defineStore } from "pinia"
import { v4 as uuid } from 'uuid'
import { mapValues } from 'lodash'
import { StringDecoder } from 'string_decoder'


export const useTradeStore = defineStore('TradeStore', {
  state: () => ({
    lsNamespace: ['default'],
    rawTrades: new Map<string, TradeEvent>(),
    trades: <t.ReportItem[]>[],
    history: new Map<string, TradeHistory>(),
  }),
  getters: {
    tradesBySecurity: (state) => {
      return new Map([...state.history].sort((a, b) => String(a[0]).localeCompare(b[0])))
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
      // console.log('persisted trade event', json)

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
        .sort((a, b) => {
          // Order by trade date
          if (a.date != b.date) return a.date.toMillis() - b.date.toMillis()
          // Buy before sell
          if (a.action != b.action) return a.action < b.action ? -1 : 1
          return 0
        })
        .map(it => t.newReportRecord2(it))

      let tradesBySec = u.groupBy(this.trades, it => it.tradeEvent.security)
      this.history.clear()

      for (let [sec, trades] of tradesBySec) {
        let optionLots = new Map<string, TradeEventLots>()

        // Group options using FIFO
        let optTrades = trades.filter(it => it.tradeEvent.options)
        for (let optTradeObj of optTrades) {
          let optTrade = optTradeObj.tradeEvent
          if (!optTrade.options) return
          let key = Object.values(optTrade.options).join('|')
          let lots = optionLots.get(key)
          if (!lots) {
            lots = {
              lots: [],
              unsure: [],
            }
            optionLots.set(key, lots)
          }

          if (optTrade.action.startsWith('buy')) { // Buy? Create a new lot
            lots.lots.push({
              trades: [optTradeObj],
              accShares: optTrade.shares,
            })
          } else { // Sell? Add to lot using FIFO
            let match = false
            for (let [i, lot] of lots.lots.entries()) {
              if (lot.accShares < optTrade.shares) // Lot has insufficient shares? Move to next lot
                continue

              lot.trades.push(optTradeObj)
              lot.accShares -= optTrade.shares
              if (i < lots.lots.length - 1) { // There are other lots this sell trade could be associated with? Put a warning
                optTradeObj.warn.push('fifo-with-alternatives')
              }
              match = true
            }

            // Couldn't fit in any lot? Add to unsure
            if (!match) {
              optTradeObj.warn.push('buy-missing')
              lots.unsure.push(optTradeObj)
            }
          }
        }

        this.history.set(sec, {
          option: optionLots,
          stock: trades.filter(it => !it.tradeEvent.options),
        })
      }

      calcGains(this.history)

      await convertForex(this.trades)
      calcGains(this.history)
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
    // .filter(it => it.options) // debugging
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

function calcGains(history: Map<string, TradeHistory>) {
  history.forEach(it => {
    calcGainsForTrades(it.stock)

    for (let [option, lots] of it.option) {
      for (let lot of lots.lots) {
        calcGainsForTrades(lot.trades)
      }
    }
  })
}

function calcGainsForTrades(trades: t.ReportItem[]) {
  trades.reduce((acb, it) => {
    let { tradeEvent: tEvent, tradeValue: tValue } = it
    if (!tValue) return acb // No CAD value? Can't calculate ACB

    if (tEvent.action === 'buy') {
      // buy cost = price * shares + outlay
      let cost = tValue.price.multiply(tEvent.shares).add(tValue.outlay)
      it.acb = t.addToAcb(acb, tEvent.shares, cost)
    }
    if (tEvent.action === 'sell') {
      if (tEvent.shares === acb.shares) { // Sold all shares? Zero-out acb
        let cost = acb.accCost.multiply(-1)
        it.acb = t.addToAcb(acb, -tEvent.shares, cost)
      } else { // Sold partial? Cost = acb * shares
        let cost = acb.acb.multiply(-tEvent.shares)
        it.acb = t.addToAcb(acb, -tEvent.shares, cost)
      }
    }

    return it.acb ?? acb
  }, {
    shares: 0,
    cost: money(0),
    accCost: money(0),
    acb: money(0),
  })

  trades.reduce((cg, it) => {
    let { tradeEvent: tEvent, tradeValue: tValue } = it
    if (!tValue) return cg // No CAD value? Can't calculate gains
    if (!it.acb) return cg // No ACB? Can't calculate gains
    if (tEvent.action !== 'sell') return cg // No sale? No gains

    let revenue = tValue.price.multiply(tEvent.shares).subtract(tValue.outlay)
    let gains = revenue.add(it.acb.cost)
    it.cg = t.addToCapGains(cg, gains)

    return it.cg ?? cg
  }, {
    gains: money(0),
    totalGains: money(0),
  })
}
