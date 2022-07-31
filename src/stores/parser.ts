import * as u from '@comp/util'
import { Option, TradeEvent } from '@store/tradeEvent'
import money from 'currency.js'
import { DateTime } from 'luxon'
import { ParseResult } from 'papaparse'
import { v4 } from 'uuid'

export abstract class TradeConfirmParser {
  headers = new Map<string, number>()
  missing
  papaErr

  constructor(headers: string[], papaRes: ParseResult<string[]>) {
    this.missing = new Set(headers)
    this.papaErr = papaRes.errors
  }

  abstract parseCsv(_: ParseResult<string[]>): TradeEvent[]
}

enum QtHeader {
  Currency = 'currencycode_group_account',
  TradeDate = 'trade date',
  SettleDate = 'settlement date',
  Action = 'action',
  Quantity = 'quantity',
  Symbol = 'symbol',
  Desc = 'description',
  Price = 'price',
  CommFees = 'comm',
  SecFees = 'sec fees',
}

// https://regex101.com/r/3pWM5r/latest
const QtOptionsRegex = /^(put|call) \.?(\w+) (\d{2}\/\d{2}\/\d{2}) (\d*(?:,\d{3})*\.?\d*),/i

export class QtParser extends TradeConfirmParser {

  constructor(papaRes: ParseResult<string[]>) {
    super(Object.values(QtHeader), papaRes)

    for (let header of this.missing) {
      let i = papaRes.data[0].findIndex(it => it === header)
      if (i > -1) {
        this.headers.set(header, i)
        this.missing.delete(header)
        continue
      }
    }
  }

  _readCsv(csv: string[], s: QtHeader) {
    return csv[this.headers.get(s)!!]
  }

  parseCsv(papaRes: ParseResult<string[]>) {
    return papaRes.data
      .slice(1) // Ignore header row
      .map(it => this._csvToTradeEvent(it))
  }

  _csvToTradeEvent(csv: string[]) {
    console.log('parsing trade', csv)
    // flip to positive
    let commFees = money(-u.parseNumber(this._readCsv(csv, QtHeader.CommFees)))
    let secFees = money(-u.parseNumber(this._readCsv(csv, QtHeader.SecFees)))

    let o = <TradeEvent>{
      id: v4(),
      date: DateTime.fromFormat(this._readCsv(csv, QtHeader.TradeDate), 'dd-MM-yy'),
      settleDate: DateTime.fromFormat(this._readCsv(csv, QtHeader.SettleDate), 'dd-MM-yy'),
      action: this._readCsv(csv, QtHeader.Action),
      shares: u.parseNumber(this._readCsv(csv, QtHeader.Quantity)),
      price: money(u.parseNumber(this._readCsv(csv, QtHeader.Price))),
      outlay: commFees.add(secFees),
      raw: csv.join(','),
    }

    let rawCurrency = this._readCsv(csv, QtHeader.Currency)
    let currency = u.CAD
    if (rawCurrency.startsWith('u.s.')) {
      currency = u.USD
    }
    o.priceFx = o.outlayFx = { currency: currency.forexCode, rate: -1 }

    let desc = this._readCsv(csv, QtHeader.Desc)
    let optionsMatch = QtOptionsRegex.exec(desc)
    if (optionsMatch) {
      let [_, optType, symbol, rawExpiration, rawStrike] = optionsMatch
      o.security = symbol
      o.shares *= 100
      o.options = <Option>{
        type: optType.toLowerCase(),
        expiryDate: DateTime.fromFormat(rawExpiration, 'MM/dd/yy'),
        strike: money(u.parseNumber(rawStrike)),
        strikeFx: o.priceFx,
      }
    } else {
      let symbol = this._readCsv(csv, QtHeader.Symbol)
      o.security = symbol ? symbol :
        desc.startsWith(`horizons u s dlr currency`) ? 'DLR' :
          desc.replace(`, avg price - ask us for details`, '')
    }

    if (o.security.startsWith('.')) { // Remove . from CAD tickers
      o.security = o.security.slice(1)
    }
    o.security = o.security.toUpperCase()

    return o
  }
}

export class IbkrParser {
  static headers = [
    'currencyprimary',
    'assetclass',
    'symbol',
    'multiplier',
    'strike',
    'expiry',
    'put/call',
    'settledate',
    'tradedate',
    'buy/sell',
    'quantity',
    'price',
    'amount',
    'proceeds',
    'commission',
    'commissioncurrency',
    'underlyingsymbol'
  ]

  static checkHeaders(data: string[][]) {
    let ans = <HeaderCheck>{
      headers: new Map(),
      missing: new Set(IbkrParser.headers),
    }

    for (let row of data) {
      if (row[0] == 'header') {
        for (let header of IbkrParser.headers) {
          let i = row.findIndex(it => it == header)
          if (i > -1) {
            ans.headers.set(header, i)
            ans.missing.delete(header)
          }
        }
        break
      }
    }
    return ans
  }

  parseCsv(data: string[][]) {

  }
}

export class CustomParser {

}

interface HeaderCheck {
  headers: Map<string, number>
  missing: Set<string>
  parser?: TradeConfirmParser
}
