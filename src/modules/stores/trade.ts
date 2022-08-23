import * as t from '@/modules/tradeNode'
import * as u from '@m/util'
import { TradeEvent } from '@/modules/tradeEvent'
import { Profile } from "@/modules/profile"
import { DateTime } from 'luxon'
import Papa, { ParseResult } from "papaparse"
import { defineStore } from "pinia"
import { Db } from '@m/stores/db'
import { QtParser, TradeConfirmParser } from '@m/stores/parser'
import { Subject } from 'rxjs'


export const useTradeStore = defineStore('TradeStore', {
  state: () => ({
    db: new Db(),
    profile: new Profile(),
  }),
  getters: {
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

    async updateTrade(trade: TradeEvent, old?: t.TradeNode) {
      // debugger
      if (old) this.profile.updateTrade(trade, old)
      else this.profile.insertTrade(trade)
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

    async insertTradeAtIndex(trade: TradeEvent, array: t.TradeNode[], pos: number) {
      array.splice(pos, 0, t.newTradeNode(trade))
      this.db.writeProfile(this.profile)
      this.db.writeTradeEvent(trade)

      await this.profile.calcGains()
    },

    importCsvFile(file: File | string, parser?: TradeConfirmParser) {
      let progress = new Subject<u.Progress>()
      progress.next({ progress: 0, hint: `Parsing file...` })

      Papa.parse(file, {
        download: true,
        skipEmptyLines: true,
        transform: it => it.trim().toLocaleLowerCase(),
        complete: (it: ParseResult<string[]>) =>
          this._onParseCsv(it, parser ?? new QtParser(it), file, progress),
      })

      return progress
    },

    // private

    async _onParseCsv(
      results: ParseResult<string[]>,
      parser: TradeConfirmParser,
      src: File | string,
      listener: Subject<u.Progress>,
    ) {
      listener.next({ progress: 25, hint: `Parsing CSV...` })
      await u.sleep(250)

      let trades = parser.parseCsv(results)
      // .filter(it => it.security == 'V') // debugging
      // .filter(it => it.options) // debugging

      if (src instanceof File) {
        trades.forEach(it => it.notes = `Imported from ${src.name} on ${u.fmt(DateTime.now())}`)
      }

      listener.next({ progress: 50, hint: `Saving ${trades.length} trade events locally...` })
      await u.sleep(250)

      trades
        .forEach(it => {
          // debugger
          this.profile.insertTrade(it)
          this.db.writeTradeEvent(it)
        })
      this.db.writeProfile(this.profile)

      listener.next({ progress: 75, hint: `Calculating ACB & Capital Gains` })
      await u.sleep(250)

      await this.profile.calcGains()

      listener.complete()
    },
  }
})
