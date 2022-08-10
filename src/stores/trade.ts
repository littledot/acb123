import * as t from '@comp/type'
import * as u from '@comp/util'
import { Profile, TradeEvent } from '@store/tradeEvent'
import { DateTime } from 'luxon'
import Papa, { ParseResult } from "papaparse"
import { defineStore } from "pinia"
import { Db } from './db'
import { QtParser, TradeConfirmParser } from './parser'


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
      console.log('init trade store')
      this.db.readDbProfile()
        ?.also(it => this.profile.init(this.db, it))
      await this.profile.calcGains()
      console.log('init trade store ok')
    },

    async insertTrade(trade: TradeEvent) {
      this.profile.insertTrade(trade)
      this.db.writeProfile(this.profile)
      this.db.writeTradeEvent(trade)

      await this.profile.calcGains()
    },

    async updateTrade(trade: TradeEvent, old: t.ReportItem) {
      // debugger
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

    importCsvFile(file: File | string, parser?: TradeConfirmParser) {
      Papa.parse(file, {
        download: true,
        skipEmptyLines: true,
        transform: it => it.trim().toLocaleLowerCase(),
        complete: (it: ParseResult<string[]>) =>
          this._onParseCsv(it, parser ?? new QtParser(it), file),
      })
    },

    // private

    async _onParseCsv(results: ParseResult<string[]>, parser: TradeConfirmParser, src: File | string) {
      let trades = parser.parseCsv(results)
      // .filter(it => it.security == 'V') // debugging
      // .filter(it => it.options) // debugging

      if (src instanceof File) {
        trades.forEach(it => it.notes = `Imported from ${src.name} on ${u.fmt(DateTime.now())}`)
      }

      trades
        .forEach(it => {
          // debugger
          this.profile.insertTrade(it)
          this.db.writeTradeEvent(it)
        })
      this.db.writeProfile(this.profile)

      await this.profile.calcGains()
    },
  }
})
