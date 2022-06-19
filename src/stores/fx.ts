import { Fx } from '@store/tradeEvent'
import axios from 'axios'
import { DateTime } from 'luxon'
import { defineStore } from 'pinia'

interface BocForexObs {
  [currencyCode: string]: BocForexRate
}

interface BocForexRate {
  [date: string]: string
}

export const useFxStore = defineStore('FxStore', {
  state: () => ({
    boc: new Map<number, BocForexObs>(),
  }),
  actions: {
    async init() {
    },

    async getRate(fx: Fx, date: DateTime) {
      if (fx.currency === 'custom') return fx.rate
      return this.getRate2(fx.currency, date)
    },

    async getRate2(currency: string, date: DateTime) {
      if (currency === 'CAD') return 1

      let code = `FX${currency}CAD`
      let rates = await this._getRatesByYear(date)
      let rate = rates[code]?.[date.toISODate()]
      if (rate) {
        return parseFloat(rate)
      }
      return NaN
    },

    // private actions

    async _loadBocs(...years: number[]) {
      for (let year of years) {
        this._loadBoc(year)
      }
    },

    async _loadBoc(year: number) {
      let url = `https://littledot.github.io/bank-of-canada-exchange-rates/data/out/boc_${year}.full.json`
      let res = await axios.get(url)

      this.boc.set(year, res.data.observations)
      console.log(`loaded boc forex`, year, res.data)
      return <BocForexObs>res.data.observations
    },

    async _getRatesByYear(date: DateTime) {
      let rates = this.boc.get(date.year)
      if (rates) return rates

      return await this._loadBoc(date.year)
    },
  },
})
