import { TradeHistory, QuestradeTrade, BuyMatch } from './types.js'



function parseNumber(str: string): number {
  let s = str.replace(/[,)]/g, '')
    .replace(/\(/g, '-')
  return parseFloat(s)
}

function groupBy<T, K extends keyof any>(list: T[], getKey: (item: T) => K): Record<K, T[]> {
  return list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);
}

const remainQuantity = (trade: QuestradeTrade): number => {
  return trade.quantity - trade.quantityMatched
}

export default {
  parseNumber,
  groupBy,
  remainQuantity,
}
