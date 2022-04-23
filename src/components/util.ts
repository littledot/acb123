
export function parseNumber(str: string): number {
  let s = str.replace(/[,)]/g, '')
    .replace(/\(/g, '-')
  return parseFloat(s)
}

export function groupBy<T, K extends keyof any>(list: T[], getKey: (item: T) => K): Map<K, T[]> {
  return list.reduce((map, item) => {
    const group = getKey(item);
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(item);
    return map;
  }, new Map());
}
