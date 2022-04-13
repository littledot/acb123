import { DateTime } from "luxon"

export interface QuestradeTrade {
  id: string,
  currency: string,
  symbol: string,
  desc: string,
  date: DateTime,
  action: string,
  quantity: number,
  price: number,
  gross: number,
  commFees: number,
  secFees: number,

  buyMatches: BuyMatch[],
  quantityMatched: number,
  net?: number,
}

export interface BuyMatch {
  id: string,
  quantity: number,
  gross: number,
}
