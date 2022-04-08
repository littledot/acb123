<script setup lang="ts">
import { ref } from 'vue'
import SearchResults from './SearchResults.vue'
import Papa from 'papaparse'
import type { ParseResult } from 'papaparse'

interface QuestradeTrade {
  currency: string,
  date: Date,
  action: string,
  quantity: number,
  symbol: string | null,
  desc: string,
  price: number,
  gross: number,
  commFees: number,
  secFees: number,
  net: string,
}

defineProps<{
  msg: string,
}>()

const count = ref(0)
const query = ref("")
const csv = ref<ParseResult<any>>()
const file = ref<File>()
const trades = ref<QuestradeTrade[]>()

function reset() {
  query.value = ""
  csv.value = Papa.parse("1|2|3")
}

function onFileChanged($event: Event) {
  const target = $event.target as HTMLInputElement;
  if (target && target.files) {
    file.value = target.files[0];
  }

  submitFile()
}

function submitFile() {
  if (!file.value) {
    console.log("no file")
  }

  Papa.parse(file.value, {
    complete: onParseCsv,
  })
}

function onParseCsv(results: ParseResult<any>) {
  trades.value = results.data
    .slice(1)
    .filter(row => row.length > 16)
    .map(row => {
      console.log(row)
      let rawDate = row[1].split('-').map(x => +x) // dd-mm-yy

      let currency = "?"
      if (row[0].startsWith("U.S.")) {
        currency = "usd"
      } else if (row[0].startsWith("Canadian")) {
        currency = "cad"
      }

      return {
        currency: currency,
        date: new Date(2000 + rawDate[2], rawDate[1], rawDate[0]),
        action: row[4].toLowerCase(),
        quantity: parseNumber(row[5]),
        symbol: row[6],
        desc: row[7],
        price: parseNumber(row[10]),
        gross: parseNumber(row[11]),
        commFees: parseNumber(row[12]),
        secFees: parseNumber(row[13]),
        net: parseNumber(row[15]),
      }
    })

  console.log(trades.value)
}

function parseNumber(str: string) {
  let s = str.replace(/[,)]/g, '')
    .replace(/\(/g, '-')
  return parseFloat(s)
}

</script>

<template>
  <h1>{{ msg }}</h1>
  <div class="container">
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
  </div>
  {{ trades }}
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
a {
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
}
</style>
