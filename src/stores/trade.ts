import * as t from '@comp/type'
import { Convert } from '@models/models'
import { useFxStore } from '@store/fx'
import { fromDbTradeEvent, Options, Profile, TradeEvent, TradeEventLots, TradeHistory } from '@store/tradeEvent'
import money from 'currency.js'
import Papa, { ParseResult } from "papaparse"
import { defineStore } from "pinia"
import { v4 as uuid } from 'uuid'


export const useTradeStore = defineStore('TradeStore', {
  state: () => ({
    lsNamespace: ['default'],
    profile: new Profile(),
    history: new Map<string, TradeHistory>(),
  }),
  getters: {
    tradesBySecurity: (state) => {
      return new Map([...state.history].sort((a, b) => String(a[0]).localeCompare(b[0])))
    }
  },
  actions: {
    async clear() {
      Object.keys(localStorage)
        .filter(it => it.startsWith(this._lsKey('trade')))
        .forEach(it => localStorage.removeItem(it))

      this.profile.clearTrades()
      this._persistProfile()

      await this._calcGains()
    },

    async init() {
      try {
        let profileStr = localStorage.getItem(this._lsKey('profile')) ?? '{}'
        let dbProfile = Convert.toDbProfile(profileStr)
        for (let [security, ids] of Object.entries(dbProfile.tradeIds)) {
          for (let id of ids) {
            try {
              let tradeStr = localStorage.getItem(this._lsKey('trade', id)) ?? '{}'
              let dbTrade = Convert.toDbTradeEvent(tradeStr)
              let trade = fromDbTradeEvent(dbTrade)
              this.profile.appendTrade(trade)
            } catch (err) {
              console.error(err)
            }
          }
        }

      } catch (err) {
        console.error(err)
      }

      await this._calcGains()
      console.log('init')
    },


    async updateTrade(trade: TradeEvent, old: TradeEvent) {
      this.profile.updateTrade(trade, old)
      this._persistTrade(trade)
      this._persistProfile()

      await this._calcGains()
    },

    async deleteTrade(trade: TradeEvent) {
      // Delete trade from ls
      localStorage.removeItem(this._lsKey('trade', trade.id))

      // Delete trade index from ls
      this.profile.deleteTrade(trade)
      this._persistProfile()

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
      // Save trade to localStorage
      let json = JSON.stringify(trade)
      localStorage.setItem(this._lsKey('trade', trade.id), json)
      console.log('persisted trade event', json)
    },

    _persistProfile() {
      // Save profile to localStorage
      let dbProfile = this.profile.toProfileJson()
      let json = Convert.dbProfileToJson(dbProfile)
      localStorage.setItem(this._lsKey('profile'), json)
      console.log('persisted profile')
    },

    async _onParseCsv(results: ParseResult<string[]>) {
      let trades = cleanData(results)
      trades.forEach(it => {
        this._persistTrade(it)
        this.profile.insertTrade(it)
      })
      this._persistProfile()

      await this._calcGains()
    },

    async _calcGains() {
      let tradesBySec = [...this.profile.tradeEvents.entries()]
        .reduce((map, [key, val]) => {
          let events = val as TradeEvent[]
          map.set(key, events.map(it => t.newReportRecord2(it)))

          return map
        }, new Map<string, t.ReportItem[]>())

      this.history.clear()

      for (let [sec, trades] of tradesBySec) {
        let optionLots = new Map<Options, TradeEventLots>()
        let optionKeys = new Map<string, TradeEventLots>()

        // Group options using FIFO
        let optTrades = trades.filter(it => it.tradeEvent.options)
        for (let optTradeObj of optTrades) {
          let optTrade = optTradeObj.tradeEvent
          if (!optTrade.options) return
          let key = Object.values(optTrade.options).join('|')
          let lots = optionKeys.get(key)
          if (!lots) {
            lots = {
              lots: [],
              unsure: [],
            }
            optionKeys.set(key, lots)
            optionLots.set(optTrade.options, lots)
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

      let trades = Array.from(tradesBySec.values())
        .reduce((arr, it) => arr.concat(it), [])

      await convertForex(trades)
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
      // sell cost = acb * shares
      let cost = acb.acb.multiply(-tEvent.shares)
      it.acb = t.addToAcb(acb, -tEvent.shares, cost)
    }

    return it.acb ?? acb
  }, {
    shares: 0,
    accShares: 0,
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
