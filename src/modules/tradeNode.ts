import { useFxStore } from '@m/stores/fx'
import { TradeEvent } from '@/modules/tradeEvent'
import money from 'currency.js'

export interface TradeNode {
  tradeEvent: TradeEvent
  tradeValue?: TradeValue // CAD
  acb?: Acb
  cg?: CapGains
  optAcb?: Acb
  optCg?: CapGains
  warn: string[]
}

export function newTradeNode(te: TradeEvent) {
  return <TradeNode>{
    tradeEvent: te,
    warn: [],
  }
}

export function sumShares(trades: TradeNode[]) {
  return trades.reduce((sum, it) => {
    let n = it.tradeEvent.action === 'buy' ? 1 : -1
    return sum + it.tradeEvent.shares * n
  }, 0)
}


export function insertTrade(trades: TradeNode[], trade: TradeEvent) {
  let it = newTradeNode(trade)
  insertTradeNode(trades, it)
}

export function insertTradeNode(trades: TradeNode[], node: TradeNode) {
  let trade = node.tradeEvent

  if (trades.length === 0) {
    trades.push(node)
    return
  }

  for (let i = trades.length - 1; i >= 0; i--) {
    if (trade.date >= trades[i].tradeEvent.date) {
      trades.splice(i + 1, 0, node)
      return
    }
  }

  // New trade has the earliest trade date? Insert at head
  trades.splice(0, 0, node)
}

export function yearGains(trades: TradeNode[]) {
  return trades[trades.length - 1]?.cg?.yearGains ?? money(0)
}

interface AssetCalc {
  setAcb(ri: TradeNode, acb: Acb): void
  getAcb(ri: TradeNode): Acb | undefined
  setCg(ri: TradeNode, cg: CapGains): void
  getCg(ri: TradeNode): CapGains | undefined

}
export const OptCalc: AssetCalc = {
  setAcb: (ri: TradeNode, it: Acb) => ri.optAcb = it,
  getAcb: (ri: TradeNode) => ri.optAcb,
  setCg: (ri: TradeNode, it: CapGains) => ri.optCg = it,
  getCg: (ri: TradeNode) => ri.optCg,
}
export const StockCalc: AssetCalc = {
  setAcb: (ri: TradeNode, it: Acb) => ri.acb = it,
  getAcb: (ri: TradeNode) => ri.acb,
  setCg: (ri: TradeNode, it: CapGains) => ri.cg = it,
  getCg: (ri: TradeNode) => ri.cg,
}

export async function calcGainsForTrades(trades: TradeNode[], assetType: AssetCalc) {
  let startIdx = trades.findIndex(it => !it.tradeValue || !assetType.getAcb(it))
  if (startIdx == -1) return // No data missing? No need to recalculate
  let target = trades.slice(startIdx)

  // Find last known good acb & cg
  let initAcb = (startIdx > 0 ? assetType.getAcb(trades[startIdx - 1]) : null) ?? {
    shares: 0,
    accShares: 0,
    cost: money(0),
    accCost: money(0),
    acb: money(0),
  }
  let initCg = (startIdx > 0 ? assetType.getCg(trades[startIdx - 1]) : null) ?? {
    gains: money(0),
    totalGains: money(0),
    year: -1,
    yearGains: money(0),
  }

  target.forEach(it => it.warn = []) // Reset warnings
  target.reduce((acb, it) => {
    let { tradeEvent: tEvent, tradeValue: tValue } = it
    let opt = tEvent.optionLot?.contract
    if (!tValue) return acb // No CAD value? Can't calculate ACB

    if (tEvent.action == 'buy') {
      // buy cost = price * shares + outlay
      let cost = tValue.price.multiply(tEvent.shares).add(tValue.outlay)
      assetType.setAcb(it, addToAcb(acb, tEvent.shares, cost))
    }

    if (['sell', 'expire'].includes(tEvent.action)) {
      // sell cost = acb * shares
      let cost = acb.acb.multiply(-tEvent.shares)
      assetType.setAcb(it, addToAcb(acb, -tEvent.shares, cost))
    }

    if (tEvent.action == 'exercise') {
      if (!opt) {
        console.error(`exercise action missing opt`)
        it.warn.push(`'opt' data missing`)
        return acb
      }

      if (opt.type == 'call' && assetType === StockCalc) {
        if (!it.optAcb) {
          console.error('exercise call missing optAcb')
          it.warn.push(`'optAcb' data missing`)
          return acb
        }

        // Exercise call, stock side: spent $ to acquire shares
        // cost = $strike * shares + outlay + (cost to acquire option)
        let cost = it.optAcb.cost.multiply(-1)
          .add(tValue.strike.multiply(tEvent.shares).add(tValue.outlay))
        it.acb = addToAcb(acb, tEvent.shares, cost)
      } else {
        // Exercise call & put, option side: used up options
        // Exercise put, stock side: sold shares at $strike
        // Effect: decrease cost in proportion to shares
        let cost = acb.acb.multiply(-tEvent.shares)
        assetType.setAcb(it, addToAcb(acb, -tEvent.shares, cost))
      }
    }

    return assetType.getAcb(it) ?? acb
  }, initAcb)

  target.reduce((cg, it) => {
    let { tradeEvent: tEvent, tradeValue: tValue } = it
    let opt = tEvent.optionLot?.contract
    // debugger
    if (!tValue) return cg // No CAD value? Can't calculate gains

    if (tEvent.action == 'exercise' && opt?.type == 'put' && assetType === StockCalc) {
      if (!it.acb) {
        console.error(`exercise put missing opt`)
        return cg
      }
      if (!it.optAcb) {
        console.error('exercise put missing optAcb')
        return cg
      }

      let strikeRev = tValue.strike.multiply(tEvent.shares).subtract(tValue.outlay)
      let buyOptCost = it.optAcb.cost.multiply(-1)
      let stockCost = it.acb.acb.multiply(tEvent.shares)
      let gains = strikeRev.subtract(buyOptCost.add(stockCost))
      assetType.setCg(it, addToCg(cg, tEvent, gains))
    }

    if (['sell', 'expire'].includes(tEvent.action)) {
      let acb = assetType.getAcb(it)
      if (!acb) {
        console.error('acb missing')
        return cg
      }
      let revenue = tValue.price.multiply(tEvent.shares).subtract(tValue.outlay)
      let gains = revenue.add(acb.cost)
      assetType.setCg(it, addToCg(cg, tEvent, gains))
    }

    return assetType.getCg(it) ?? cg
  }, initCg)
}

export async function convertForex(items: TradeNode[]) {
  for (let it of items) {
    if (it.tradeValue) continue
    let te = it.tradeEvent

    let fxStore = useFxStore()
    let priceForex = await fxStore.getRate(te.priceFx, te.date)
    let outlayForex = await fxStore.getRate(te.outlayFx, te.date)

    let tv = {
      price: te.price.multiply(priceForex),
      priceForex: priceForex,
      outlay: te.outlay.multiply(outlayForex),
      outlayForex: outlayForex,
      strike: money(0),
      strikeForex: 0,
    }

    let opt = te.optionLot?.contract
    if (opt) {
      tv.strikeForex = await fxStore.getRate(opt.strikeFx, te.date)
      tv.strike = opt.strike.multiply(tv.strikeForex)
    }

    it.tradeValue = tv
  }
  return items
}

export interface TradeValue {
  price: money
  priceForex: number
  outlay: money
  outlayForex: number
  strike: money
  strikeForex: number
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

export function addToCg(cg: CapGains, tEvent: TradeEvent, gains: money) {
  return {
    gains: gains,
    totalGains: cg.totalGains.add(gains),
    // New year? Reset yearGains
    year: tEvent.date.year,
    yearGains: cg.year != tEvent.date.year ? gains : cg.yearGains.add(gains),
  }
}
