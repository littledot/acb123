import { Option } from '@store/tradeEvent'
import { DateTime } from 'luxon'
import * as v from 'vue'

export enum DI {
  Fx = 'fx'
}
export interface DateField {
  date: v.Ref<DateTime>
  err: v.Ref<string>
}

export function vueModel(props: any, emit: any, name = 'modelValue') {
  return v.computed({
    get: () => props[name],
    set: (value) => emit(`update:${name}`, value)
  })
}

export function debugVue(tag?: string, dbg?: boolean) {
  return {
    onTrack(e: any) {
      console.log({ tag: tag, onTrack: e })
      if (dbg) debugger
    },
    onTrigger(e: any) {
      console.log({ tag: tag, onTrigger: e })
      if (dbg) debugger
    }
  }
}

const isProd = process.env.NODE_ENV === 'production'

export function log(msg?: any, ...args: any) {
  if (isProd) return
  console.log(msg, ...args)
}

export function err(msg?: any, ...args: any) {
  if (isProd) return
  console.error(msg, ...args)
}

export function parseNumber(str: string): number {
  let s = str.replace(/[,)]/g, '')
    .replace(/\(/g, '-')
  return parseFloat(s)
}

export function groupBy<T, K extends keyof any>(list: T[], getKey: (item: T) => K): Map<K, T[]> {
  return list.reduce((map, item) => {
    const group = getKey(item)
    if (!map.has(group)) map.set(group, [])
    map.get(group)!!.push(item)
    return map
  }, new Map<K, T[]>())
}

export function mapValues<K extends keyof any, V, O>(
  map: Map<K, V>,
  mapper: (item: V) => O,
): Map<K, O> {
  let out = new Map<K, O>()
  for (let [key, val] of map.entries()) {
    out.set(key, mapper(val))
  }
  return out
}

export function mapGetDefault<K, V>(
  map: Map<K, V>,
  key: K,
  backup: () => V,
): V {
  let val = map.get(key)
  if (val === undefined) {
    val = backup()
    map.set(key, val)
  }
  return val
}

export function sortIter<T>(
  iter: IterableIterator<T>,
  compareFn?: (a: T, b: T) => number,
): T[] {
  return [...iter].sort(compareFn)
}

export const CAD = {
  forexCode: 'CAD', symbol: "$", precision: 2, // Intl.NumberFormat
  currency: 'CAD', rate: 0 // DbFx
}
export const USD = {
  forexCode: 'USD', symbol: "US$", precision: 2,
  currency: 'USD', rate: 0
}

export const numFmt = new Intl.NumberFormat('en-US')
export const signNumFmt = new Intl.NumberFormat('en-US', { signDisplay: 'always' })

export const moneyFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function fmt(it: undefined | DateTime | number): string {
  if (it instanceof DateTime)
    return it.toISODate()
  if (typeof it === 'number')
    return numFmt.format(it)
  return ''
}

export function fmtMoney(n: number | undefined) {
  return n ? moneyFmt.format(n) : null
}

export function isUndef(o: any) {
  return o === void 0
}

export const months = new Map([
  [1, 'January'],
  [2, 'February'],
  [3, 'March'],
  [4, 'April'],
  [5, 'May'],
  [6, 'June'],
  [7, 'July'],
  [8, 'August'],
  [9, 'September'],
  [10, 'October'],
  [11, 'November'],
  [12, 'December'],
])

export const importFmts = new Map([
  ['ibkr', 'Interactive Brokers'],
  ['qt', 'Questrade'],
  // ['custom', 'Custom'],
])
