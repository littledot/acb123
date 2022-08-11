import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import money from 'currency.js'
import * as t from '../reportItem'

export let fakeFx = () => ({
  currency: 'CAD',
  rate: 0,
})

export let fakeTrade = () => ({
  id: '1',
  security: 'A',
  date: DateTime.local(2000, 6, 1),
  settleDate: DateTime.local(2000, 6, 2),
  action: 'buy',
  shares: 100,
  price: money(10),
  priceFx: fakeFx(),
  outlay: money(1),
  outlayFx: fakeFx(),
})

describe('sumShares', () => {
  it("should add trades' shares", () => {
    let trades = [
      fakeTrade(),
      { ...fakeTrade(), action: 'sell', shares: 10, },
    ].map(it => t.newReportRecord2(it))

    expect(t.sumShares(trades)).toEqual(90)
  })
})

describe('insertTrade', () => {
  it("should insert trades with earlier trade date in front of trades with later trade date", () => {
    let out = <t.ReportItem[]>[]
    let trade = fakeTrade()
    let trade1 = { ...fakeTrade(), date: DateTime.local(2000, 5, 1) }
    let trade2 = { ...fakeTrade(), date: DateTime.local(2000, 5, 15) }

    t.insertTrade(out, trade)
    expect(out[0].tradeEvent).toBe(trade)

    t.insertTrade(out, trade1)
    expect(out[0].tradeEvent).toBe(trade1)
    expect(out[1].tradeEvent).toBe(trade)

    t.insertTrade(out, trade2)
    expect(out[0].tradeEvent).toBe(trade1)
    expect(out[1].tradeEvent).toBe(trade2)
    expect(out[2].tradeEvent).toBe(trade)
  })
})
