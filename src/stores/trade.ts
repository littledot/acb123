import { ReportItem } from './../components/type'
import { OptionHistory } from './tradeEvent'
import * as t from '@comp/type'
import { Convert } from '@models/models'
import { Profile, TradeEvent, TradeHistory } from '@store/tradeEvent'
import Papa, { ParseResult } from "papaparse"
import { defineStore } from "pinia"
import { v4 as uuid } from 'uuid'
import { Db } from './db'


export const useTradeStore = defineStore('TradeStore', {
  state: () => ({
    db: new Db(),
    profile: new Profile(),
  }),
  getters: {
    tradesBySecurity: (state) => {
      return new Map([...state.profile.tradeHistory].sort((a, b) => String(a[0]).localeCompare(b[0])))
    },
    tradeHistory: (state) => state.profile.tradeReport,
  },
  actions: {
    async clear() {
      this.profile.clearTrades()
      this.db.writeProfile(this.profile)
      this.db.clearTradeEvent()
    },

    async init() {
      this.db.readDbProfile()
        ?.also(it => this.profile.init(this.db, it))
      await this.profile.calcGains()
      console.log('init')
    },

    async insertTrade(trade: TradeEvent) {
      this.profile.insertTrade(trade)
      this.db.writeProfile(this.profile)
      this.db.writeTradeEvent(trade)

      await this.profile.calcGains()
    },

    async updateTrade(trade: TradeEvent, old: t.ReportItem) {
      debugger
      this.profile.updateTrade(trade, old)
      this.db.writeProfile(this.profile)
      this.db.writeTradeEvent(trade)

      await this.profile.calcGains()
    },

    async deleteTrade(trade: TradeEvent) {
      this.profile.deleteTrade(trade)
      this.db.writeProfile(this.profile)
      this.db.deleteTradeEvent(trade)

      await this.profile.calcGains()
    },

    async insertTradeAtIndex(trade: TradeEvent, array: t.ReportItem[], pos: number) {
      array.splice(pos, 0, t.newReportRecord2(trade))
      this.db.writeProfile(this.profile)
      this.db.writeTradeEvent(trade)

      await this.profile.calcGains()
    },

    importCsvFile(file: File | string) {
      Papa.parse(file, {
        download: true,
        transform: (s) => s.trim(),
        complete: this._onParseCsv,
      })
    },

    // private

    async _onParseCsv(results: ParseResult<string[]>) {
      let trades = cleanData(results)
      trades.forEach(it => {
        this.profile.insertTrade(it)
        this.db.writeTradeEvent(it)
      })
      this.db.writeProfile(this.profile)

      await this.profile.calcGains()
    },
  }
})

function cleanData(results: ParseResult<string[]>) {
  let trades = results.data
    .slice(1)
    .filter(row => row.length > 16)
    .map((row, i) => t.newQuestradeEvent(uuid(), row))
    // .filter((it) => it.symbol === 'SLV') // debugging
    .map(it => t.newTradeEvent(it))
    // .filter(it => it.options) // debugging
  return trades
}
