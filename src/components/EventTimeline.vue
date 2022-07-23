<script setup lang='ts'>
import Icon from '@comp/core/Icon.vue'
import StockEvent from '@comp/StockEvent.vue'
import { mdiClockAlertOutline, mdiCurrencyUsd } from '@mdi/js'
import { Option, OptionHistory, TradeEvent, TradeHistory } from '@store/tradeEvent'
import { capitalize } from 'lodash'
import { DateTime } from 'luxon'
import { v4 } from 'uuid'
import OptionEvent from './OptionEvent.vue'
import { sumShares } from './type'
import ExpiredOptionsHint from './ExpiredOptionsHintView.vue'
import OptionHistoryView from './OptionHistoryView.vue'

let props = defineProps<{
  events: TradeHistory
}>()
let emits = defineEmits({})
</script>

<template>
  <div class="flex flex-col">
    <div v-if="events.option.size > 0"
         id="options">

      <div v-for="([_, optHists], i) of events.option">
        <div v-for="(optHist, j) of optHists">
          <div class="flex flex-row gap-x-4 items-center">
            <div class="w-[calc(36rem+2rem)] flex flex-row items-center mr-7">
              <div class="flex flex-row items-center font-semibold text-xl mr-90">
                <span>
                  {{ capitalize(optHist.contract.type) }} options</span>
                <Icon class="w-5 h-5 ml-2 mr-1"
                      :path="mdiClockAlertOutline" />
                <span>
                  {{ optHist.contract.expiryDate.toISODate() }}</span>
                <Icon class="w-5 h-5 ml-2"
                      :path="mdiCurrencyUsd" />
                <span>
                  {{ optHist.contract.strike }}</span>
              </div>
            </div>
            <p class="w-[12rem] text-right font-semibold"
               :class="{ hidden: i + j > 0 }">Cost</p>
            <p class="w-[12rem] text-right font-semibold"
               :class="{ hidden: i + j > 0 }">Shares</p>
            <!-- <p class="w-[12rem] text-right font-semibold"
             :class="{ hidden: i+j > 0 }">Shares</p> -->
            <p class="w-[12rem] text-right font-semibold"
               :class="{ hidden: i + j > 0 }">ACB</p>
            <p class="w-[12rem] text-right font-semibold"
               :class="{ hidden: i + j > 0 }">Capital Gains</p>
          </div>

          <OptionHistoryView :history="optHist" />
        </div>
      </div>
    </div>
    <div v-if="events.stock.length > 0"
         id="stocks">
      <div class="flex flex-row gap-x-4 items-center">
        <div class="w-[calc(36rem+2rem)] flex flex-row items-center mr-7">
          <p class="text-left font-semibold text-xl">Stocks</p>
        </div>
        <p class="w-[12rem] text-right font-semibold"
           :class="{ hidden: events.option.size > 0 }">Cost</p>
        <!-- <p class="w-[12rem] text-left text-right font-semibold"
           :class="{ hidden: events.option.size > 0 }">Accumulated Options</p> -->
        <p class="w-[12rem] text-right font-semibold"
           :class="{ hidden: events.option.size > 0 }">Shares</p>
        <p class="w-[12rem] text-right font-semibold"
           :class="{ hidden: events.option.size > 0 }">ACB</p>
        <p class="w-[12rem] text-right font-semibold"
           :class="{ hidden: events.option.size > 0 }">Capital Gains</p>
      </div>

      <div v-for="(it, i) of events.stock"
           :key="it.tradeEvent.id">
        <StockEvent :event="it"
                    :isFirst="i === 0"
                    :isLast="i === events.stock.length - 1" />
      </div>
    </div>
  </div>
</template>
<style scoped>
.timeline-grid {
  display: grid;
  grid-template-columns: [price-l] min-content [price-r cost-l] min-content [cost-r shares-l] min-content [shares-r acb-l] min-content [acb-r cg-l] min-content [cg-r];
  grid-auto-rows: auto;
}
</style>
