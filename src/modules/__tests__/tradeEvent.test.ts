import $ from 'currency.js'
import { DateTime } from 'luxon'
import { createPinia, setActivePinia } from 'pinia'
import * as Uuid from 'uuid'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import * as t from '../tradeEvent'


beforeAll(() => { setActivePinia(createPinia()) })

let fakeFx = () => ({
  currency: `CAD`,
  rate: 0,
})

let fakeOption = () => ({
  type: `call`,
  expiryDate: DateTime.local(1, 1, 1),
  strike: $(0),
  strikeFx: fakeFx(),
})

let fakeOptionLot = () => ({
  id: `new`,
  contract: fakeOption(),
  trades: [],
})

let fakeTrade = () => ({
  id: `1`,
  security: `A`,
  date: DateTime.local(1, 1, 1),
  settleDate: DateTime.local(1, 1, 1),
  action: `buy`,
  shares: 0,
  price: $(0),
  priceFx: fakeFx(),
  outlay: $(0),
  outlayFx: fakeFx(),
})


describe(`TradeHistory.insertTrade()`, async () => {
  it(`should insert stock trade into stock lot`, async () => {
    let trade = fakeTrade()

    let ans = new t.TradeHistory()
    ans.insertTrade(trade)

    expect(ans.stock[0].tradeEvent).toBe(trade)
    expect(ans.option.size).toBe(0)
    expect(ans.orphan.length).toBe(0)
  })

  it(`should create new lot when inserting option buy`, async () => {
    vi.spyOn(Uuid, 'v4').mockImplementation(() => 'rand-uuid')
    let opt = { ...fakeOptionLot() }
    let trade = { ...fakeTrade(), optionLot: opt }

    let ans = new t.TradeHistory()
    ans.insertTrade(trade)

    expect(ans.stock.length).toBe(0)
    expect(ans.option.size).toBe(1)
    expect(ans.orphan.length).toBe(0)

    let lot = ans.option.get(t.optionHash(opt.contract))![0]
    expect(lot.id).toBe('rand-uuid')
    expect(lot.contract).toBe(opt.contract)
    expect(lot.trades[0].tradeEvent).toBe(trade)

    // should append to existing lot when id is not `new`
    let trade1 = { ...fakeTrade(), optionLot: lot }

    ans.insertTrade(trade1)

    expect(lot.trades[1].tradeEvent).toBe(trade1)
  })

  it(`should append option sale to matching lot`, async () => {
    let opt = { ...fakeOptionLot(), }
    let trade0 = { ...fakeTrade(), optionLot: opt }
    let trade1 = { ...fakeTrade(), optionLot: opt, action: 'sell' }

    let ans = new t.TradeHistory()
    ans.insertTrade(trade0)
    ans.insertTrade(trade1)

    expect(ans.stock.length).toBe(0)
    expect(ans.option.size).toBe(1)
    expect(ans.orphan.length).toBe(0)

    let lot = ans.option.get(t.optionHash(opt.contract))![0]
    expect(lot.trades[0].tradeEvent).toBe(trade0)
    expect(lot.trades[1].tradeEvent).toBe(trade1)
  })

  it(`should append option sale to orphan lot when date is earlier than buy`, async () => {
    let opt = { ...fakeOptionLot(), }
    let trade0 = { ...fakeTrade(), optionLot: opt, date: DateTime.local(2000, 1, 2) }
    let trade1 = { ...fakeTrade(), optionLot: opt, date: DateTime.local(2000, 1, 1), action: 'sell' }

    let ans = new t.TradeHistory()
    ans.insertTrade(trade0)
    ans.insertTrade(trade1)

    expect(ans.stock.length).toBe(0)
    expect(ans.option.size).toBe(1)
    expect(ans.orphan[0]).toBe(trade1)
  })

  it(`should append option sale to oprhan lot when lot has insufficient shares for sale`, async () => {
    let opt = { ...fakeOptionLot() }
    let trade0 = { ...fakeTrade(), optionLot: opt, }
    let trade1 = { ...fakeTrade(), optionLot: opt, action: 'sell', shares: 1 }

    let ans = new t.TradeHistory()
    ans.insertTrade(trade0)
    ans.insertTrade(trade1)

    expect(ans.stock.length).toBe(0)
    expect(ans.option.size).toBe(1)
    expect(ans.orphan[0]).toBe(trade1)
  })

  it(`should insert exercise option to both option and stock lots`, async () => {
    let opt = { ...fakeOptionLot() }
    let trade0 = { ...fakeTrade(), optionLot: opt, }
    let trade1 = { ...fakeTrade(), optionLot: opt, action: 'exercise' }

    let ans = new t.TradeHistory()
    ans.insertTrade(trade0)
    ans.insertTrade(trade1)

    expect(ans.stock[0].tradeEvent).toBe(trade1)
    expect(ans.option.size).toBe(1)
    expect(ans.orphan.length).toBe(0)

    let lot = ans.option.get(t.optionHash(opt.contract))![0]
    expect(lot.trades[0].tradeEvent).toBe(trade0)
    expect(lot.trades[1].tradeEvent).toBe(trade1)
  })
})

