<script setup lang='ts'>
import Icon from '@comp/core/Icon.vue'
import StockEvent from '@comp/StockEvent.vue'
import { mdiClockAlertOutline, mdiCurrencyUsd } from '@mdi/js'
import { Option, OptionHistory, TradeEvent, TickerTradeHistory } from '@store/tradeEvent'
import { capitalize } from 'lodash'
import { DateTime } from 'luxon'
import { v4 } from 'uuid'
import OptionEvent from './OptionEvent.vue'
import { sumShares } from './type'
import ExpiredOptionsHint from './ExpiredOptionsHintView.vue'
import OptionHistoryView from './OptionHistoryView.vue'

let props = defineProps<{
  events: TickerTradeHistory
}>()
let emits = defineEmits({})
</script>

<template>
  <div class="flex flex-col">
    <div v-if="events.option.length > 0"
         id="options">

      <div v-for="(optHist, i) of events.option">
        <div class="event-grid items-center">
          <div class="col-[1/4] flex flex-row items-center">
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
          <p class="col-[4/5] text-right font-semibold"
             :class="{ hidden: i > 0 }">Cost</p>
          <p class="col-[5/6] text-right font-semibold"
             :class="{ hidden: i > 0 }">Shares</p>
          <!-- <p class="col-[5/6] text-right font-semibold"
             :class="{ hidden: i+j > 0 }">Shares</p> -->
          <p class="col-[6/7] text-right font-semibold"
             :class="{ hidden: i > 0 }">ACB</p>
          <p class="col-[7/8] text-right font-semibold"
             :class="{ hidden: i > 0 }">Capital Gains</p>
        </div>

        <OptionHistoryView :history="optHist" />
        <!-- </div> -->
      </div>
    </div>
    <div v-if="events.stock.length > 0"
         id="stocks">
      <div class="event-grid items-center pl-5">
        <div class="col-[1/4] flex flex-row items-center">
          <p class="text-left font-semibold text-xl">Stocks</p>
        </div>
        <p class="col-[4/5] text-right font-semibold"
           :class="{ hidden: events.option.length > 0 }">Cost</p>
        <!-- <p class="col-[5/6] text-left text-right font-semibold"
           :class="{ hidden: events.option.length > 0 }">Options</p> -->
        <p class="col-[5/6] text-right font-semibold"
           :class="{ hidden: events.option.length > 0 }">Shares</p>
        <p class="col-[6/7] text-right font-semibold"
           :class="{ hidden: events.option.length > 0 }">ACB</p>
        <p class="col-[7/8] text-right font-semibold"
           :class="{ hidden: events.option.length > 0 }">Capital Gains</p>
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
<style>
.event-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: auto;
  column-gap: 1rem;
  row-gap: 0.5rem;
}
</style>
<style scoped>
</style>
