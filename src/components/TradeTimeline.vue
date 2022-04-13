<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { QuestradeTrade, BuyMatch } from './types.js'
import Alert from './Alert.vue';


const props = defineProps<{
  trades: QuestradeTrade[],
}>()

const tradesView = ref()

onMounted(() => init())

const init = () => {
  let trades = props.trades

  let tradesById = <Record<string, QuestradeTrade>>{}
  trades.forEach(trade => tradesById[trade.id] = trade)

  tradesView.value = trades.map((trade) => {
    let numFmt = new Intl.NumberFormat("en-US")
    let moneyFmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: trade.currency,
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    let buys = trade.buyMatches.map(buyMatch => {
      let buyTrade = tradesById[buyMatch.id]
      return {
        id: buyTrade.id,
        date: buyTrade.date.toISODate(),
        quantity: numFmt.format(buyMatch.quantity),
        gross: moneyFmt.format(buyMatch.gross),
      }
    });

    return {
      date: trade.date.toISODate(),
      currency: trade.currency.toUpperCase(),
      action: trade.action == "buy" ? "Bought" : "Sold",
      symbol: trade.symbol,
      quantity: numFmt.format(trade.quantity),
      price: moneyFmt.format(trade.price),
      fees: moneyFmt.format(trade.commFees + trade.secFees),
      grossLabel: trade.action == "buy" ? "Cost" : "Proceeds",
      gross: moneyFmt.format(trade.gross),
      net: trade.net ? moneyFmt.format(trade.net) : undefined,

      buyMatches: buys,
      missingBuys: trade.action != "buy" && buys.length == 0,
    }
  })

  console.log("tradesView", tradesView.value)
}

</script>
<template>
  <ol class="w-11/12 m-auto border-l-2 border-blue-600">
    <li v-for="trade of tradesView">
      <!-- title -->
      <div class="flex flex-start items-center">
        <div class="bg-blue-600 w-4 h-4 flex items-center justify-center rounded-full -ml-2 mr-2 -mt-2"></div>
        <h4 class="text-gray-800 font-semibold text-xl -mt-2">
          {{ trade.date }}: {{ trade.action }} {{ trade.quantity }} units
        </h4>
      </div>
      <!-- details -->
      <div class="flex flex-row flex-wrap gap-x-2 gap-y-1 ml-4 mb-2">
        <div>
          <strong>Price:</strong> {{ trade.price }}
        </div>
        <div class="text-gray-700">
          <strong>Fees:</strong> {{ trade.price }}
        </div>
        <div class="text-gray-700 basis-full text-left">
          <strong>{{ trade.grossLabel }}:</strong> {{ trade.gross }}
        </div>
        <div v-if="trade.net" class="text-gray-700">
          <strong>Net:</strong> {{ trade.net }}
        </div>
      </div>

      <!-- breakdown -->
      <Alert v-if="trade.missingBuys" msg="Could not find acquisition of sold securities. Assuming cost basis of $0.
        (Trade history may not be complete.)" />

      <div v-if="trade.buyMatches.length > 0" class="flex flex-col">
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
                  <tr v-for="buyTrade of trade.buyMatches" class="bg-white border-b">
                    <td class="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ buyTrade.date }}
                    </td>
                    <td class="text-sm text-gray-900 font-light px-6 py-2 whitespace-nowrap">
                      Buy {{ buyTrade.quantity }}
                    </td>
                    <td class="text-sm text-gray-900 font-light px-6 py-2 whitespace-nowrap text-right">
                      {{ buyTrade.gross }}
                    </td>
                  </tr>
                  <tr class="bg-white border-b">
                    <td class="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ trade.date }}
                    </td>
                    <td class="text-sm text-gray-900 font-light px-6 py-2 whitespace-nowrap">
                      Sell {{ trade.quantity }}
                    </td>
                    <td class="text-sm text-gray-900 font-light px-6 py-2 whitespace-nowrap text-right">
                      {{ trade.gross }}
                    </td>
                  </tr>
                  <tr class="bg-gray-100 border-b">
                    <td class="text-gray-900 font-bold px-6 py-2 whitespace-nowrap text-left">
                      Net:
                    </td>
                    <td />
                    <td class="text-sm text-gray-900 font-bold px-6 py-2 whitespace-nowrap text-right">
                      {{ trade.net }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </li>
  </ol>
</template>
