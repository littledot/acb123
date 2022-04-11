<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SearchResults from './SearchResults.vue'
import Papa from 'papaparse'
import type { ParseResult } from 'papaparse'
import questradeUrl from "@/assets/questrade.csv?url"
import SvgIcon from '@jamescoyle/vue-icon'
import { mdiAccount } from '@mdi/js'
import TradeTimeline from './TradeTimeline.vue'
import { QuestradeTrade, BuyMatch } from './types.js'
import { DateTime } from "luxon"

const icon = ref(mdiAccount)
const icon2 = ref("M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm64-192c0-8.8 7.2-16 16-16h288c8.8 0 16 7.2 16 16v64c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16v-64zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z")

const remainQuantity = (trade: QuestradeTrade): number => {
  return trade.quantity - trade.quantityMatched
}

defineProps<{
  msg: string,
}>()

const count = ref(0)
const query = ref("")
const csv = ref<ParseResult<any>>()
const file = ref<File>()
const trades = ref<QuestradeTrade[]>()
const tradesBySymbol = ref<Record<string, QuestradeTrade[]>>()

onMounted(() => {
  parseFile(questradeUrl)
})

function reset() {
  query.value = ""
  csv.value = Papa.parse("1|2|3")
}

function onFileChanged($event: Event) {
  const target = $event.target as HTMLInputElement;
  if (target && target.files) {
    file.value = target.files[0];
  }
}

function submitFile() {
  if (!file.value) {
    console.log("no file")
    return
  }

  parseFile(file.value)
}

function parseFile(file: File | string) {
  Papa.parse(file, {
    download: true,
    transform: (s) => s.trim(),
    complete: onParseCsv,
  })
}

function onParseCsv(results: ParseResult<string>) {
  trades.value = results.data
    .slice(1)
    .filter(row => row.length > 16)
    .map((row, i) => {
      let date = row[1].split("-").map(x => +x) // dd-mm-yy

      let currency = "?"
      if (row[0].startsWith("U.S.")) {
        currency = "usd"
      } else if (row[0].startsWith("Canadian")) {
        currency = "cad"
      }

      let desc = row[7].replace(", AVG PRICE - ASK US FOR DETAILS", "")

      let symbol = row[6]
      if (row[7].startsWith("HORIZONS U S DLR CURRENCY")) {
        symbol = ".DLR"
      }
      if (!symbol) {
        symbol = desc
      }

      return <QuestradeTrade>{
        id: "" + i,
        currency: currency,
        date: DateTime.local(2000 + date[2], date[1], date[0]),
        action: row[4].toLowerCase(),
        quantity: parseNumber(row[5]),
        symbol: symbol,
        desc: desc,
        price: parseNumber(row[10]),
        gross: parseNumber(row[11]),
        commFees: parseNumber(row[12]),
        secFees: parseNumber(row[13]),
        net: parseNumber(row[15]),

        buyMatches: [],
        quantityMatched: 0,
      }
    })

  console.log(trades.value)

  tradesBySymbol.value = analyzeTrades(trades.value)
}

function parseNumber(str: string): number {
  let s = str.replace(/[,)]/g, '')
    .replace(/\(/g, '-')
  return parseFloat(s)
}

const groupBy = <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);

function analyzeTrades(trades: QuestradeTrade[]): Record<string, QuestradeTrade[]> {
  let tradesBySymbol = groupBy(trades, o => {
    console.log("key:", o.symbol)
    return o.symbol
  })
  console.log(tradesBySymbol)

  for (let [symbol, trades] of Object.entries(tradesBySymbol)) {
    console.log(symbol, trades)

    trades.slice().reverse().forEach((sellTrade, i, trades) => {
      if (sellTrade.action == "sell") {

        trades.slice(i + 1).every((buyTrade) => {
          if (buyTrade.action == "buy" && remainQuantity(buyTrade) > 0) {
            let match = <BuyMatch>{
              id: buyTrade.id,
              quantity: Math.min(remainQuantity(sellTrade), remainQuantity(buyTrade))
            }
            buyTrade.quantityMatched += match.quantity
            sellTrade.quantityMatched += match.quantity
            sellTrade.buyMatches.push(match)
          }
          return remainQuantity(sellTrade) > 0
        })
      }

    })
  }

  console.log(tradesBySymbol)
  return tradesBySymbol
}

</script>

<template>
  <h1>{{ msg }}</h1>

  <div>
    <h2>Single File</h2>
    <hr />
    <label>
      File
      <input type="file" @change="onFileChanged($event)" />
    </label>
    <br />
    <button @click="submitFile()">Submit</button>
  </div>

  <div class="accordion" id="accordionExample5">
    <div v-for="(trades, symbol, i) of tradesBySymbol" class="accordion-item bg-white border border-gray-200">
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

  <div>
    <h2>Filter LearnVue Articles</h2>
    <input type="text" placeholder="Filter Search" v-model="query" />
    {{ query }}
    <button @click="reset()">Reset</button>
    <SearchResults :query="query" />
  </div>

  <p>
    Recommended IDE setup:
    <a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
    +
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
  </p>

  <p>
    See
    <code>README.md</code> for more information.
  </p>

  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">Vite Docs</a>
    |
    <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Docs</a>
  </p>

  <button type="button" @click="count++">count is: {{ count }}</button>
  <p>
    Edit
    <code>components/HelloWorld.vue</code> to test hot module replacement.
  </p>
</template>

<style scoped>
/* a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
} */
</style>
