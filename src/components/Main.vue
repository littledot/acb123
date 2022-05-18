<script setup lang='ts'>
import { ref, reactive, computed, provide, inject, onMounted, onRenderTracked, onRenderTriggered } from 'vue'
import Papa from 'papaparse'
import type { ParseResult } from 'papaparse'
import questradeUrl from '@/assets/questrade.csv?url'
import * as t from './type'
import * as s from './symbol'
import * as u from './util'
import EventTimeline from './EventTimeline.vue'
import money from 'currency.js'

const data = ref(<t.ReportItem[]>[])
const ui = ref(new Map<string, t.ReportItem[]>())
const forex = new t.Forex()

onMounted(() => {
  parseFile(questradeUrl)
})

function parseFile(file: File | string) {
  Papa.parse(file, {
    download: true,
    transform: (s) => s.trim(),
    complete: onParseCsv,
  })
}


function onParseCsv(results: ParseResult<string[]>) {
  data.value = cleanData(results)
  ui.value = calcGains(data.value)
  console.log('ui=', ui.value)

  convertForex(data.value)
    .then(it => calcGains(it))
}

function cleanData(results: ParseResult<string[]>) {
  let trades = results.data
    .slice(1)
    .filter(row => row.length > 16)
    .map((row, i) => t.newQuestradeEvent(`` + i, row))
    .sort((a, b) => a.date.toMillis() - b.date.toMillis()) // Order by date
    .map(it => t.newReportRecord(it))

  return trades
}

async function convertForex(items: t.ReportItem[]) {
  for (let it of items) {
    if (it.tradeValue) continue
    let te = it.tradeEvent

    let priceForex = await forex.getRate(te.price.currency, it.tradeEvent.date)
    let outlayForex = await forex.getRate(te.outlay.currency, it.tradeEvent.date)

    it.tradeValue = {
      price: te.price.amount.multiply(priceForex),
      priceForex: priceForex,
      outlay: te.outlay.amount.multiply(outlayForex),
      outlayForex: outlayForex,
    }
  }
  return items
}

function calcGains(items: t.ReportItem[]) {
  let events = u.groupBy(items, it => it.tradeEvent.security)
  events = new Map([...events].sort((a, b) => String(a[0]).localeCompare(b[0])))


  events.forEach(it => {
    it.reduce((acb, it) => {
      let val = it.tradeValue
      if (!val) return acb // No CAD value? Can't calculate ACB

      if (it.tradeEvent.action === 'buy') {
        // buy cost = price * shares - -outlay
        let cost = val.price.multiply(it.tradeEvent.shares).subtract(val.outlay)
        it.acb = t.addToAcb(acb, it.tradeEvent.shares, cost)
      }
      if (it.tradeEvent.action === 'sell') {
        // sell cost = acb * shares
        let cost = acb.acb.multiply(it.tradeEvent.shares)
        it.acb = t.addToAcb(acb, -it.tradeEvent.shares, cost)
      }

      return it.acb ?? acb
    }, {
      shares: 0,
      cost: money(0),
      acb: money(0),
    })

    it.reduce((cg, it) => {
      let val = it.tradeValue
      if (!val) return cg // No CAD value? Can't calculate gains
      if (!it.acb) return cg // No ACB? Can't calculate gains
      if (it.tradeEvent.action !== 'sell') return cg // No sale? No gains

      let rev = val.price.multiply(it.tradeEvent.shares).add(val.outlay)
      let gains = rev.subtract(it.acb.cost)
      it.cg = t.addToCapGains(cg, gains)

      return it.cg ?? cg
    }, {
      gains: money(0),
      totalGains: money(0),
    })
  })

  return events
}

function showFirst(i: number) {
  return i == 0 ? ['show'] : ['collapse']
}

</script>

<template>
  <div id="accordionExample5"
       class="accordion">
    <div v-for="([symbol, events], i) of ui"
         class="accordion-item bg-white border border-gray-200">
      <h2 :id="'heading' + i"
          class="accordion-header mb-0">
        <button class="accordion-button relative flex items-center w-full py-4 px-5 text-base text-gray-800 text-left bg-white border-0 rounded-none transition focus:outline-none"
                type="button"
                data-bs-toggle="collapse"
                :data-bs-target="'#collapse' + i"
                aria-expanded="false"
                aria-controls="collapseOne5">{{ symbol }}</button>
      </h2>
      <div :id="'collapse' + i"
           class="accordion-collapse collapse"
           :class="showFirst(i)"
           :aria-labelledby="'collapse' + i">
        <div class="accordion-body py-4 px-5">
          <EventTimeline :events="events" />
        </div>
      </div>
    </div>
  </div>
</template>
