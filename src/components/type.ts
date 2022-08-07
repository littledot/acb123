import { useFxStore } from '@store/fx'
import { TradeEvent } from '@store/tradeEvent'
import money from 'currency.js'

export interface ReportItem {
  tradeEvent: TradeEvent
  tradeValue?: TradeValue // CAD
  acb?: Acb
  cg?: CapGains
  warn: string[]
}

export function newReportRecord2(te: TradeEvent) {
  return <ReportItem>{
    tradeEvent: te,
    warn: [],
  }
}

export function sumShares(trades: ReportItem[]) {
  return trades.reduce((sum, it) => {
    let n = it.tradeEvent.action.let(it => it === 'buy' ? 1 : -1)
    return sum + it.tradeEvent.shares * n
  }, 0)
}


export function insertTrade(trades: ReportItem[], trade: TradeEvent) {
  let it = newReportRecord2(trade)

  if (trades.length === 0) {
    trades.push(it)
    return
  }

  for (let i = trades.length - 1; i >= 0; i--) {
    if (trade.date >= trades[i].tradeEvent.date) {
      trades.splice(i + 1, 0, it)
      return
    }
  }
}

export function yearGains(trades: ReportItem[]) {
  return trades[trades.length - 1]?.cg?.yearGains ?? money(0)
}

export async function calcGainsForTrades(trades: ReportItem[]) {
  let startIdx = trades.findIndex(it => !it.tradeValue || !it.acb)
  if (startIdx == -1) return // No data missing? No need to recalculate
  let target = trades.slice(startIdx)

  // Find last known good acb & cg
  let initAcb = (startIdx > 0 ? trades[startIdx - 1].acb : null) ?? {
    shares: 0,
    accShares: 0,
    cost: money(0),
    accCost: money(0),
    acb: money(0),
  }
  let initCg = (startIdx > 0 ? trades[startIdx - 1].cg : null) ?? {
    gains: money(0),
    totalGains: money(0),
    year: -1,
    yearGains: money(0),
  }


  target.reduce((acb, it) => {
    let { tradeEvent: tEvent, tradeValue: tValue } = it
    if (!tValue) return acb // No CAD value? Can't calculate ACB

    if (tEvent.action === 'buy') {
      // buy cost = price * shares + outlay
      let cost = tValue.price.multiply(tEvent.shares).add(tValue.outlay)
      it.acb = addToAcb(acb, tEvent.shares, cost)
    }
    if (['sell', 'expire'].includes(tEvent.action)) {
      // sell cost = acb * shares
      let cost = acb.acb.multiply(-tEvent.shares)
      it.acb = addToAcb(acb, -tEvent.shares, cost)
    }

    return it.acb ?? acb
  }, initAcb)

  target.reduce((cg, it) => {
    let { tradeEvent: tEvent, tradeValue: tValue } = it
    if (!tValue) return cg // No CAD value? Can't calculate gains
    if (!it.acb) return cg // No ACB? Can't calculate gains
    if (!['sell', 'expire'].includes(tEvent.action)) return cg // No sale? No change to gains

    let revenue = tValue.price.multiply(tEvent.shares).subtract(tValue.outlay)
    let gains = revenue.add(it.acb.cost)

    it.cg = {
      gains: gains,
      totalGains: cg.totalGains.add(gains),
      // New year? Reset yearGains
      year: tEvent.date.year,
      yearGains: cg.year != tEvent.date.year ? gains : cg.yearGains.add(gains),
    }

    return it.cg ?? cg
  }, initCg)
}

export async function convertForex(items: ReportItem[]) {
  for (let it of items) {
    if (it.tradeValue) continue
    let te = it.tradeEvent

    let fxStore = useFxStore()
    let priceForex = await fxStore.getRate(te.priceFx, it.tradeEvent.date)
    let outlayForex = await fxStore.getRate(te.outlayFx, it.tradeEvent.date)

    it.tradeValue = {
      price: te.price.multiply(priceForex),
      priceForex: priceForex,
      outlay: te.outlay.multiply(outlayForex),
      outlayForex: outlayForex,
    }
  }
  return items
}

export interface Fx {
  currency: string
  rate: number
}

export interface TradeValue {
  price: money
  priceForex: number
  outlay: money
  outlayForex: number
}

export interface Acb {
  shares: number
  accShares: number
  cost: money
  accCost: money
  acb: money
}

export function addToAcb(acb: Acb, shares: number, cost: money) {
  let newShares = acb.accShares + shares
  // Sold all shares? Zero-out acb
  let newCost = newShares === 0 ? acb.accCost.multiply(-1) : cost
  let newAccCost = acb.accCost.add(newCost)
  return {
    shares: shares,
    accShares: newShares,
    cost: newCost,
    accCost: newAccCost,
    acb: newShares === 0 ? money(0) : newAccCost.divide(newShares),
  }
}

export interface CapGains {
  gains: money
  totalGains: money
  year: number
  yearGains: money
}
