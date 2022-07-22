import { Profile, toDbTradeEvent, TradeEvent } from '@store/tradeEvent'
import { Convert } from '@models/models'
import { fromDbTradeEvent } from './tradeEvent'

export class Db {
  namespace = ['default']
  db = localStorage

  _lsKey(...keys: string[]) {
    return this.namespace.concat(keys).join('|')
  }

  readTradeEvent(tradeId: string) {
    return this._lsKey('trade', tradeId)
      .let(it => this.db.getItem(it))
      ?.let(it => Convert.toDbTradeEvent(it))
      ?.let(it => fromDbTradeEvent(it))
  }

  writeTradeEvent(trade: TradeEvent) {
    toDbTradeEvent(trade)
      .let(it => Convert.dbTradeEventToJson(it))
      .let(it => this.db.setItem(this._lsKey('trade', trade.id), it))
  }

  deleteTradeEvent(trade: TradeEvent) {
    this.db.removeItem(this._lsKey('trade', trade.id))
  }

  clearTradeEvent() {
    Object.keys(this.db)
      .filter(it => it.startsWith(this._lsKey('trade')))
      .forEach(it => this.db.removeItem(it))
  }

  readDbProfile() {
    return this.db.getItem(this._lsKey('profile'))
      ?.let(it => Convert.toDbProfile(it))
  }

  writeProfile(profile: Profile) {
    profile.toDbModel()
      .let(it => Convert.dbProfileToJson(it))
      .let(it => this.db.setItem(this._lsKey('profile'), it))
  }
}
