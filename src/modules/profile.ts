import { DbProfile } from '@m/models/models'
import { Db } from '@m/stores/db'
import * as t from '@/modules/tradeNode'
import * as u from '@m/util'
import { TradeHistory, AnnualTradeHistory, TradeEvent } from '@m/tradeEvent'


export class Profile {
  tradeHistory = new Map<string, TradeHistory>();
  tradeReport = <[number, AnnualTradeHistory][]>[];

  init(db: Db, dbProfile: DbProfile) {
    // debugger
    for (let [security, dbHistory] of Object.entries(dbProfile.tradeHistory)) {
      let history = new TradeHistory()
      history.init(db, dbHistory)
      this.tradeHistory.set(security, history)
    }
  }

  groupByYear() {
    let data = new Map<number, AnnualTradeHistory>()

    let tradeHistory = u.sortIter(this.tradeHistory.entries(), (a, b) => String(a[0]).localeCompare(b[0]))
    for (let [security, history] of tradeHistory) {
      let { stocks, options } = history.groupByYear()

      for (let [year, trades] of stocks) {
        u.mapGetDefault(data, year, () => new AnnualTradeHistory())
          .appendStocks(security, trades)
      }

      for (let [year, trades] of options) {
        u.mapGetDefault(data, year, () => new AnnualTradeHistory())
          .appendOptions(security, trades)
      }

      // Do not group orphans by year
      u.mapGetDefault(data, 0, () => new AnnualTradeHistory())
        .appendOrphan(security, history.orphan)
    }

    return u.sortIter(data.entries(), (a, b) => b[0] - a[0])
  }

  insertTrade(trade: TradeEvent) {
    let history = u.mapGetDefault(this.tradeHistory, trade.security,
      () => new TradeHistory())
    history.insertTrade(trade)
  }

  async calcGains() {
    for (let history of this.tradeHistory.values()) {
      for (let optHistory of history.option.values()) {
        for (let optTrades of optHistory) {
          await t.convertForex(optTrades.trades)
          t.calcGainsForTrades(optTrades.trades, t.OptCalc)
        }
      }
      await t.convertForex(history.stock)
      t.calcGainsForTrades(history.stock, t.StockCalc)
    }

    this.tradeReport = this.groupByYear()
  }

  updateTrade(trade: TradeEvent, oldTrade: t.TradeNode) {
    let old = oldTrade.tradeEvent
    // Complex change? Treat it like a new trade
    if (trade.date !== old.date // Trade date change? Order change
      || trade.security !== old.security // Security change? Group change
      || trade.optionLot?.id != old.optionLot?.id // Option lot change?
      || trade.action != old.action // Action change?
    ) {
      this.deleteTrade(old)
      this.insertTrade(trade)
      return
    }

    // Replace old trade at same position
    oldTrade.tradeEvent = trade
    oldTrade.tradeValue = oldTrade.acb = oldTrade.optAcb = void 0
  }

  deleteTrade(trade: TradeEvent) {
    this.tradeHistory.get(trade.security)
      ?.let(it => it.deleteTrade(trade))
  }

  clearTrades() {
    this.tradeHistory.clear()
    this.tradeReport = []
  }

  toDbModel() {
    let hist = <any>{}
    for (let [security, history] of this.tradeHistory) {
      hist[security] = history.toDbModel()
    }

    return <DbProfile>{
      tradeHistory: hist,
    }
  }
}
