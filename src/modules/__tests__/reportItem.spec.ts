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
  date: DateTime.local(2000, 1, 1),
  settleDate: DateTime.local(2000, 1, 2),
  action: 'buy',
  shares: 100,
  price: money(10),
  priceFx: fakeFx(),
  outlay: money(1),
  outlayFx: fakeFx(),
})

describe('sumShares', () => {
  it('should add/minus shares', () => {
    let a = { tradeEvent: { ...fakeTrade() } }
    let b = { tradeEvent: { ...fakeTrade(), action: 'sell', shares: 10, } }

    expect(t.sumShares([a, b])).toEqual(90)
  })
})

describe('insertTrade', () => {
  it('should push new event when list is empty', () => {
    let out = <t.ReportItem[]>[]
    let trade = { id: '123' }

    t.insertTrade(out, trade)

    expect(out.length).toEqual(1)
    expect(out[0].tradeEvent).toBe(trade)
  })
})
