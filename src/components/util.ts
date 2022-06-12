import * as v from 'vue'

export enum DI {
  Fx = 'fx'
}

export function vueModel(props: any, emit: any, name = 'modelValue') {
  return v.computed({
    get: () => props[name],
    set: (value) => emit(`update:${name}`, value)
  })
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
    map.get(group).push(item)
    return map
  }, new Map())
}

export const numFmt = new Intl.NumberFormat("en-US")

export const moneyFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function fmtNum(n: number) {
  return Number.isNaN(n) ? null : numFmt.format(n)
}

export function fmtMoney(n: number | undefined) {
  return n ? moneyFmt.format(n) : null
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
