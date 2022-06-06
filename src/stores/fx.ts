import { DateTime } from 'luxon'
import { BocForexObs, Fx } from '@comp/type'
import axios from 'axios'
import { defineStore } from 'pinia'

export const useFxStore = defineStore('FxStore', {
  state: () => ({
    boc: new Map<number, BocForexObs>(),
  }),
  actions: {
    async getRate(fx: Fx, date: DateTime) {
      if (fx.currency === 'custom') return fx.rate
      return this.getRate2(fx.currency, date)
    },

    async getRate2(currency: string, date: DateTime) {
      if (currency === 'CAD') return 1

      let code = `FX${currency}CAD`
      let rates = await this.z_getRatesByYear(date)
      let rate = rates[code]?.[date.toISODate()]
      if (rate) {
        return parseFloat(rate)
      }
      return NaN
    },

    // private actions

    async z_loadBocs(...years: number[]) {
      for (let year of years) {
        this.z_loadBoc(year)
      }
    },

    async z_loadBoc(year: number) {
      let url = `https://littledot.github.io/bank-of-canada-exchange-rates/data/out/boc_${year}.full.json`
      let res = await axios.get(url)

      this.boc.set(year, res.data.observations)
      console.log(`loaded boc forex`, year, res.data)
      return <BocForexObs>res.data.observations
    },

    async z_getRatesByYear(date: DateTime) {
      let rates = this.boc.get(date.year)
      if (rates) return rates

      return await this.z_loadBoc(date.year)
    },
  },
})
