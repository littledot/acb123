<script setup lang='ts'>
import { ref, reactive, computed, provide, inject, onMounted, onRenderTracked, onRenderTriggered } from 'vue'
import Papa from 'papaparse'
import type { ParseResult } from 'papaparse'
import questradeUrl from '@/assets/questrade.csv?url'
import * as t from './type'
import * as s from './symbol'
import * as util from './util'
import TradeTimeline from './TradeTimeline.vue'

const props = defineProps<{
}>()

const userTrades = ref(new Map<string, t.TradeEvent>())
const tradesBySymbol = computed(() =>
  util.groupBy(Array.from(userTrades.value.values()), it => it.symbol)
)
const forexRates = ref(new t.Forex())
provide(s.FOREX_RATES, forexRates)

onMounted(() => {
  parseFile(questradeUrl)
})

onRenderTriggered((event) => {
  console.log(`Main.onRenderTriggered`, event.key, event)
})

function parseFile(file: File | string) {
  Papa.parse(file, {
    download: true,
    transform: (s) => s.trim(),
    complete: doParseCsv,
  })
}


async function onParseCsv(results: ParseResult<string[]>) {
  doParseCsv(results)
    .catch(err => console.error(`boo`, err))
}

async function doParseCsv(results: ParseResult<string[]>) {
  let trades = await cleanData(results)
  trades.forEach(it => userTrades.value.set(it.id, it))

  trades = await matchBuySellTrades(trades)
  loadForex(trades)
}

async function cleanData(results: ParseResult<string[]>) {
  let trades = results.data
    .slice(1)
    .filter(row => row.length > 16)
    .map((row, i) => new t.TradeEvent(`` + i, row))
    .sort((a, b) => {
      if (a.date != b.date) { // Order by date first
        return a.date.toMillis() - b.date.toMillis()
      }
      if (a.action != b.action) { // Same date? Put buys before sells
        return a.action == 'buy' ? -1 : 1
      }
      // Same action? Put higher price last to minimize gains
      return a.price < b.price ? -1 : 1
    })

  return trades
}

async function matchBuySellTrades(trades: t.TradeEvent[]) {
  let tradesBySymbol = util.groupBy(trades, it => it.symbol)
  console.log(tradesBySymbol)

  for (let [symbol, trades] of tradesBySymbol) {
    trades.slice().reverse().forEach((sellTrade, i, trades) => {
      if (sellTrade.action == "sell") {
        trades.slice(i + 1).every((buyTrade) => {
          sellTrade.matchDisposition(buyTrade)
          return sellTrade.unmatchedQuantity() > 0
        })
      }
    })
  }

  console.log(tradesBySymbol)
  return trades
}

async function loadForex(trades: t.TradeEvent[]) {
  let years = new Set<number>()
  for (let trade of trades) {
    years.add(trade.date.year)
  }

  await forexRates.value.loadBoc(...years)
}

</script>
<template>

  <div class="accordion" id="accordionExample5">
    <div v-for="([symbol, trades], i) of tradesBySymbol" class="accordion-item bg-white border border-gray-200">
      <h2 class="accordion-header mb-0" :id="'heading' + i">
        <button
          class="accordion-button relative flex items-center w-full py-4 px-5 text-base text-gray-800 text-left bg-white border-0 rounded-none transition focus:outline-none"
          type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse' + i" aria-expanded="false"
          aria-controls="collapseOne5">{{ symbol }}</button>
      </h2>
      <div :id="'collapse' + i" class="accordion-collapse collapse" :aria-labelledby="'collapse' + i">
        <div class="accordion-body py-4 px-5">
          <TradeTimeline :trades="trades" />
        </div>
      </div>
    </div>
  </div>

</template>
