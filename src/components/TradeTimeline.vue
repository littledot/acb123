<script setup lang="ts">
import { ref, computed, inject, onMounted, onRenderTriggered } from 'vue'
import type { Ref } from 'vue'
import _ from 'lodash'
import Alert from './Alert.vue'
import * as t from './type'
import * as s from './symbol'
import * as u from './util'
import { uptime } from 'process'

const props = defineProps<{
  trades: t.TradeEvent[],
}>()

const forexRates = <Ref<t.Forex>>inject(s.FOREX_RATES)
const trades = ref(props.trades)

const tradesView = computed(() => toViewModel(props.trades, forexRates.value))

onRenderTriggered((event) => {
  console.log(`TradeTimeline.onRenderTriggered`, event.key, event)
})

function toViewModel(trades: t.TradeEvent[], forexRates: t.Forex) {
  console.log(`TradeTimeline props`, trades)

  let tradesView = trades.map((trade) => {
    let forex = forexRates.getBocRateByTrade(trade)

    let value = trade.price * trade.quantity
    let fees = trade.commFees + trade.secFees
    let gross = value + fees
    let cadGross = gross * forex

    let view = <any>{
      date: trade.date.toISODate(),
      currency: trade.currency,
      action: trade.action == "buy" ? "Bought" : "Sold",
      symbol: trade.symbol,
      quantity: u.numFmt.format(trade.quantity),
      price: u.moneyFmt.format(trade.price),
      value: u.moneyFmt.format(value),
      fees: u.moneyFmt.format(fees),
      gross: u.moneyFmt.format(gross),
      cadGross: u.fmtMoney(cadGross),
      grossLabel: trade.action == "buy" ? "Cost Basis" : "Proceeds",
      forex: forex,
    }

    let buys = <any>[]
    if (trade.action == "sell") {
      let cadBuyGross = 0

      buys = trade.matchedEvents.map(match => {
        let forex = forexRates.getBocRateByTrade(match.tradeEvent)
        let cadGross = forex ? match.gross() * forex : NaN
        cadBuyGross += cadGross

        return {
          id: match.tradeEvent.id,
          date: match.tradeEvent.date.toISODate(),
          quantity: u.numFmt.format(match.quantity),
          totalQuantity: u.numFmt.format(match.tradeEvent.quantity),
          cadGross: u.fmtMoney(cadGross),
        }
      });

      let cadGains = cadGross - cadBuyGross

      view.breakdown = {
        missingBuys: buys.length == 0,
        buyViews: buys,
        cadBuyGross: u.fmtMoney(cadBuyGross),
        cadGains: u.fmtMoney(cadGains),
      }
    }

    return view
  })

  console.log("tradesView", tradesView)
  return tradesView
}

</script>
<template>
  <ol class="w-11/12 m-auto border-l-2 border-blue-600">
    <li v-for="view of tradesView">
      <!-- title -->
      <div class="flex flex-start items-center">
        <div class="bg-blue-600 w-4 h-4 flex items-center justify-center rounded-full -ml-2 mr-2 -mt-2"></div>
        <h4 class="text-gray-800 font-semibold text-xl -mt-2">
          {{ view.date }}: {{ view.action }} {{ view.quantity }} units
        </h4>
      </div>
      <!-- details -->
      <div class="flex flex-row flex-wrap gap-x-2 gap-y-1 ml-4 mb-2">
        <div class="basis-full text-left">
          Quantity: <strong>{{ view.quantity }}</strong> x
          Price({{ view.currency }}): <strong>{{ view.price }}</strong>
        </div>
        <div class="basis-full text-left">
          = Value:<strong>{{ view.value }}</strong> + Fees: <strong>{{ view.fees }}</strong>
        </div>
        <!-- Not CAD? Show forex conversion -->
        <div v-if="view.currency != 'CAD'" class="basis-full text-left">
          = {{ view.grossLabel }}({{ view.currency }}): <strong>{{ view.gross }}</strong> x
          Forex:<strong>{{ view.forex }}</strong>
        </div>
        <div class="basis-full text-left">
          = {{ view.grossLabel }}(CAD): <strong>{{ view.cadGross }}</strong>
        </div>
      </div>

      <!-- cost basis breakdown -->
      <Alert v-if="view.breakdown?.missingBuys" msg="Could not find acquisition of sold securities. Assuming cost basis of $0.
        (Trade history may not be complete.)" />

      <div v-if="view.breakdown?.buyViews?.length > 0" class="flex flex-col">
        <div class="overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="py-2 inline-block min-w-full sm:px-6 lg:px-8">
            <div class="text-left ml-4"><strong>Disposition Breakdown:</strong></div>
            <div class="overflow-hidden">
              <table class="min-w-full text-center">
                <thead class="border-b bg-white">
                  <tr>
                    <th scope="col" class="text-sm font-bold text-gray-900 px-6 py-2">
                      Date
                    </th>
                    <th scope="col" class="text-sm font-bold text-gray-900 px-6 py-2">
                      Quantity
                    </th>
                    <th scope="col" class="text-sm font-bold text-gray-900 px-6 py-2">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="buyView of view.breakdown?.buyViews" class="bg-white border-b">
                    <td class="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ buyView.date }}
                    </td>
                    <td class="text-sm text-gray-900 font-light px-6 py-2 whitespace-nowrap">
                      Buy {{ buyView.quantity }} / {{ buyView.totalQuantity }}
                    </td>
                    <td class="text-sm text-gray-900 font-light px-6 py-2 whitespace-nowrap text-right">
                      {{ buyView.cadGross }}
                    </td>
                  </tr>
                  <tr class="bg-white border-b">
                    <td class="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ view.date }}
                    </td>
                    <td class="text-sm text-gray-900 font-light px-6 py-2 whitespace-nowrap">
                      Sell {{ view.quantity }}
                    </td>
                    <td class="text-sm text-gray-900 font-light px-6 py-2 whitespace-nowrap text-right">
                      {{ view.cadGross }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- capital gains -->
        <div>
          Proceeds: {{ view.cadGross }} - Cost Basis: {{ view.breakdown?.cadBuyGross }}
        </div>
        <div>
          Capital Gains: {{ view.breakdown?.cadGains }}
        </div>
      </div>
    </li>
  </ol>
</template>
