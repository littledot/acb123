import { TradeEvent } from '@m/tradeEvent'
import $ from 'currency.js'
import { DateTime } from 'luxon'
import { v4 } from 'uuid'


function newOption(type: string, expiry: DateTime, strike: number, strikeFx: string) {
  return {
    id: `new`,
    contract: {
      expiryDate: expiry,
      strike: $(strike),
      strikeFx: {
        currency: strikeFx,
        rate: 0
      },
      type: type
    },
    trades: [],
  }
}

export function newDemoTrades(): TradeEvent[] {
  return [{
    action: `buy`,
    date: DateTime.local(2020, 12, 15),
    id: v4(),
    outlay: $(4.95),
    outlayFx: {
      currency: `USD`,
      rate: 0
    },
    price: $(124.32),
    priceFx: {
      currency: `USD`,
      rate: 0
    },
    security: `AAPL`,
    settleDate: DateTime.local(2020, 12, 17),
    shares: 300
  },
  {
    action: `sell`,
    date: DateTime.local(2021, 1, 28),
    id: v4(),
    outlay: $(5.87),
    outlayFx: {
      currency: `USD`,
      rate: 0
    },
    price: $(138.11),
    priceFx: {
      currency: `USD`,
      rate: 0
    },
    security: `AAPL`,
    settleDate: DateTime.local(2021, 2, 1),
    shares: 100
  },
  {
    action: `buy`,
    date: DateTime.local(2021, 2, 15),
    id: v4(),
    optionLot: newOption(`put`, DateTime.local(2022, 3, 1), 150, `USD`),
    outlay: $(25.92),
    outlayFx: {
      currency: `USD`,
      rate: 0
    },
    price: $(15),
    priceFx: {
      currency: `USD`,
      rate: 0
    },
    security: `AAPL`,
    settleDate: DateTime.local(2021, 10, 18),
    shares: 100
  },
  {
    action: `exercise`,
    date: DateTime.local(2021, 4, 15),
    id: v4(),
    optionLot: newOption(`put`, DateTime.local(2022, 3, 1), 150, `USD`),
    outlay: $(20),
    outlayFx: {
      currency: `USD`,
      rate: 0
    },
    price: $(100),
    priceFx: {
      currency: `USD`,
      rate: 0
    },
    security: `AAPL`,
    settleDate: DateTime.local(2021, 12, 16),
    shares: 100
  },
  {
    action: `sell`, // Will become orphan
    date: DateTime.local(2021, 2, 15),
    id: v4(),
    optionLot: newOption(`put`, DateTime.local(2022, 3, 1), 150, `USD`),
    outlay: $(25.92),
    outlayFx: {
      currency: `USD`,
      rate: 0
    },
    price: $(15),
    priceFx: {
      currency: `USD`,
      rate: 0
    },
    security: `AAPL`,
    settleDate: DateTime.local(2021, 10, 18),
    shares: 100
  },

  {
    action: `buy`,
    date: DateTime.local(2021, 10, 15),
    id: v4(),
    optionLot: newOption(`call`, DateTime.local(2022, 1, 19), 350, `USD`),

    outlay: $(10.92),
    outlayFx: {
      currency: `USD`,
      rate: 0
    },
    price: $(1),
    priceFx: {
      currency: `USD`,
      rate: 0
    },
    security: `MSFT`,
    settleDate: DateTime.local(2021, 10, 18),
    shares: 1000
  },
  {
    action: `sell`,
    date: DateTime.local(2021, 11, 26),
    id: v4(),
    optionLot: newOption(`call`, DateTime.local(2022, 1, 19), 350, `USD`),
    outlay: $(4.49),
    outlayFx: {
      currency: `USD`,
      rate: 0
    },
    price: $(6.8),
    priceFx: {
      currency: `USD`,
      rate: 0
    },
    security: `MSFT`,
    settleDate: DateTime.local(2021, 11, 29),
    shares: 200
  },
  {
    action: `exercise`,
    date: DateTime.local(2021, 12, 15),
    id: v4(),
    optionLot: newOption(`call`, DateTime.local(2022, 1, 19), 350, `USD`),
    outlay: $(25),
    outlayFx: {
      currency: `USD`,
      rate: 0
    },
    price: $(350),
    priceFx: {
      currency: `USD`,
      rate: 0
    },
    security: `MSFT`,
    settleDate: DateTime.local(2021, 12, 16),
    shares: 300
  },
  ]
}
