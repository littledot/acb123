import $ from 'currency.js'
import { DateTime } from 'luxon'
import { createPinia, setActivePinia } from 'pinia'
import { beforeAll, describe, expect, it } from 'vitest'
import { Option } from '../tradeEvent'
import * as t from '../tradeNode'

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

let fakeOptionLot = (contract?: Option) => ({
  id: `2`,
  contract: contract ?? fakeOption(),
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

describe(`sumShares`, async () => {
  it(`should add trades' shares`, async () => {
    let trades = [
      { ...fakeTrade(), action: `buy`, shares: 100, },
      { ...fakeTrade(), action: `sell`, shares: 10, },
    ].map(t.newTradeNode)

    expect(t.sumShares(trades)).toEqual(90)
  })
})

describe(`insertTrade`, async () => {
  it(`should insert trades with earlier trade date in front of trades with later trade date`, async () => {
    let out = <t.TradeNode[]>[]
    let trade0 = { ...fakeTrade(), date: DateTime.local(2000, 6, 1) }
    let trade1 = { ...fakeTrade(), date: DateTime.local(2000, 5, 1) }
    let trade2 = { ...fakeTrade(), date: DateTime.local(2000, 5, 15) }

    t.insertTrade(out, trade0)
    expect(out[0].tradeEvent).toBe(trade0)

    t.insertTrade(out, trade1)
    expect(out[0].tradeEvent).toBe(trade1)
    expect(out[1].tradeEvent).toBe(trade0)

    t.insertTrade(out, trade2)
    expect(out[0].tradeEvent).toBe(trade1)
    expect(out[1].tradeEvent).toBe(trade2)
    expect(out[2].tradeEvent).toBe(trade0)
  })
})


describe(`convertForex`, async () => {
  it(`should calculate tradeValue`, async () => {
    let trade = {
      ...fakeTrade(), price: $(1), outlay: $(2),
      optionLot: fakeOptionLot({ ...fakeOption(), strike: $(3) }),
    }
    let inp = t.newTradeNode(trade)

    await t.convertForex([inp])

    expect(inp.tradeValue).toEqual({
      price: $(1), priceForex: 1,
      outlay: $(2), outlayForex: 1,
      strike: $(3), strikeForex: 1,
    })
  })
})

describe(`calcGains`, () => {
  it(`should average out acb of multiple buys`, async () => {
    let inp = [
      { ...fakeTrade(), shares: 10, price: $(2), outlay: $(0) },
      { ...fakeTrade(), shares: 20, price: $(3), outlay: $(0) },
    ].map(t.newTradeNode)

    await t.convertForex(inp)
    t.calcGainsForTrades(inp, t.StockCalc)

    expect(inp.map(it => it.acb)).toEqual([{
      shares: 10, accShares: 10,
      cost: $(20), accCost: $(20),
      acb: $(2),
    }, {
      shares: 20, accShares: 30,
      cost: $(60), accCost: $(80),
      acb: $(2.67),
    }])

    expect(inp.map(it => it.cg)).toEqual([void 0, void 0])
  })

  it(`should zero out acb when all shares are sold`, async () => {
    let inp = [
      { ...fakeTrade(), shares: 1, price: $(0), outlay: $(0) },
      { ...fakeTrade(), shares: 2, price: $(1), outlay: $(0) },
      { ...fakeTrade(), shares: 3, price: $(3), outlay: $(0), action: `sell` },
    ].map(t.newTradeNode)

    await t.convertForex(inp)
    t.calcGainsForTrades(inp, t.StockCalc)

    expect(inp.map(it => it.acb)).toEqual([
      expect.any(Object), {
        shares: 2, accShares: 3,
        cost: $(2), accCost: $(2),
        acb: $(0.67), // Ensure fractional acb
      }, {
        shares: -3, accShares: 0,
        cost: $(-2), accCost: $(0),
        acb: $(0), // Assert no extra cents
      }])
  })

  it(`should reset yearGains if sale is in diff year`, async () => {
    let inp = [
      { ...fakeTrade(), shares: 10, price: $(10), outlay: $(10) },
      { ...fakeTrade(), shares: 5, price: $(1), outlay: $(3), action: `sell` },
      // Sale in same year should add to yearGains
      { ...fakeTrade(), shares: 3, price: $(1), outlay: $(3), action: `sell` },
      // Sale in diff year should reset yearGains
      { ...fakeTrade(), shares: 2, price: $(1), outlay: $(3), action: `sell`, date: DateTime.local(2, 1, 1), },
    ].map(t.newTradeNode)

    await t.convertForex(inp)
    t.calcGainsForTrades(inp, t.StockCalc)

    expect(inp.map(it => it.acb)).toEqual([{
      shares: 10, accShares: 10,
      cost: $(110), accCost: $(110),
      acb: $(11),
    }, {
      shares: -5, accShares: 5,
      cost: $(-55), accCost: $(55),
      acb: $(11),
    }, {
      shares: -3, accShares: 2,
      cost: $(-33), accCost: $(22),
      acb: $(11),
    }, {
      shares: -2, accShares: 0,
      cost: $(-22), accCost: $(0),
      acb: $(0),
    }])

    expect(inp.map(it => it.cg)).toEqual([
      void 0, {
        gains: $(5 * 1 - 3 - 5 * 11), // -53
        totalGains: $(-53),
        year: 1,
        yearGains: $(-53),
      }, {
        gains: $(3 * 1 - 3 - 3 * 11), // -33
        totalGains: $(-53 - 33), // -86
        year: 1,
        yearGains: $(-86),
      }, {
        gains: $(2 * 1 - 3 - 2 * 11), // -23
        totalGains: $(-86 - 23),
        year: 2,
        yearGains: $(-23),
      }])
  })

  it(`exercise call options`, async () => {
    let opt = fakeOptionLot({ ...fakeOption(), type: `call`, strike: $(20), })
    let optHist = [
      { ...fakeTrade(), shares: 10, price: $(10), outlay: $(5), optionLot: opt, },
      { ...fakeTrade(), shares: 10, price: $(20), outlay: $(10), action: `exercise`, optionLot: opt },
    ].map(t.newTradeNode)
    let stockHist = [optHist[1]]

    await t.convertForex(optHist)
    t.calcGainsForTrades(optHist, t.OptCalc)
    t.calcGainsForTrades(stockHist, t.StockCalc)

    expect(optHist.map(it => it.optAcb)).toEqual([{
      shares: 10, accShares: 10,
      cost: $(105), accCost: $(105),
      acb: $(10.5),
    }, {
      shares: -10, accShares: 0,
      cost: $(-105), accCost: $(0),
      acb: $(0),
    }])
    expect(optHist.map(it => it.optCg)).toEqual([void 0, void 0])

    expect(stockHist.map(it => it.acb)).toEqual([{
      shares: 10, accShares: 10,
      cost: $(315), accCost: $(315),
      acb: $(31.5),
    }])
    expect(stockHist.map(it => it.cg)).toEqual([void 0])
  })

  it(`exercise put options`, async () => {
    let opt = fakeOptionLot({ ...fakeOption(), type: `put`, strike: $(20), })
    let optHist = [
      { ...fakeTrade(), shares: 10, price: $(10), outlay: $(4), optionLot: opt, },
      { ...fakeTrade(), shares: 10, price: $(20), outlay: $(5), action: `exercise`, optionLot: opt },
    ].map(t.newTradeNode)
    let stockHist = [
      t.newTradeNode({ ...fakeTrade(), shares: 20, price: $(30), outlay: $(10) }),
      optHist[1],
    ]

    await t.convertForex(optHist)
    await t.convertForex(stockHist)
    t.calcGainsForTrades(optHist, t.OptCalc)
    t.calcGainsForTrades(stockHist, t.StockCalc)

    expect(optHist.map(it => it.optAcb)).toEqual([{
      shares: 10, accShares: 10,
      cost: $(104), accCost: $(104),
      acb: $(10.4),
    }, {
      shares: -10, accShares: 0,
      cost: $(-104), accCost: $(0),
      acb: $(0),
    }])
    expect(optHist.map(it => it.optCg)).toEqual([void 0, void 0])

    expect(stockHist.map(it => it.acb)).toEqual([{
      shares: 20, accShares: 20,
      cost: $(610), accCost: $(610),
      acb: $(30.5),
    }, {
      shares: -10, accShares: 10,
      cost: $(-305), accCost: $(305),
      acb: $(30.5),
    }])
    expect(stockHist.map(it => it.cg)).toEqual([
      void 0, {
        gains: $(-214),
        totalGains: $(-214),
        year: 1,
        yearGains: $(-214),
      }])
  })
})
