
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

export function fmtNum(n: number | undefined) {
  return Number.isNaN(n) ? null : numFmt.format(n)
}

export function fmtMoney(n: number | undefined) {
  return n ? moneyFmt.format(n) : null
}

export function ifT<I, O extends keyof any>(t: I, ifTruthy: (it: I) => O): O | null {
  return t ? ifTruthy(t) : null
}
