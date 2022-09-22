<script setup lang='ts'>
import Icon from '@c/core/Icon.vue'
import Pill from '@c/core/Pill.vue'
import OptionLotView from '@c/OptionLotView.vue'
import OrphanEvent from '@c/OrphanEvent.vue'
import StockEvent from '@c/StockEvent.vue'
import { TickerTradeHistory } from '@m/tradeEvent'
import * as u from '@m/util'
import { mdiClockAlertOutline, mdiCurrencyUsd } from '@mdi/js'
import { capitalize } from 'lodash'

let props = defineProps<{
  events: TickerTradeHistory
}>()
let emits = defineEmits({})
</script>

<template>
  <div class="flex-col">
    <div v-if="events.option.length > 0"
         id="options">

      <div v-for="(optLot, i) of events.option">

        <hr v-if="i > 0"
            id="divider"
            class="h-[1px] w-full mb-2 bg-gray-200" />

        <div class="event-grid items-center">
          <div class="col-[1/4] flex items-center">
            <div class="flex items-center font-semibold mr-90">
              <span>
                {{ capitalize(optLot.contract.type) }} options</span>
              <Icon class="w-4 h-4 ml-2 mr-1"
                    :path="mdiClockAlertOutline" />
              <span>
                {{ u.fmt(optLot.contract.expiryDate) }}</span>
              <Icon class="w-4 h-4 ml-2"
                    :path="mdiCurrencyUsd" />
              <span>
                {{ optLot.contract.strike }}</span>
              <Pill type="light"
                    class="ml-2">#{{ optLot.id.slice(-4) }}</Pill>
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

        <OptionLotView :option-lot="optLot" />
      </div>
    </div>

    <div v-if="events.stock.length > 0"
         id="stocks">

      <hr v-if="events.option.length > 0"
          id="divider"
          class="h-[1px] w-full mb-2 bg-gray-400" />

      <div class="event-grid items-center pl-5">
        <div class="col-[1/4] flex items-center">
          <p class="text-left font-semibold">Stocks</p>
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

    <div v-if="events.orphan.length > 0">
      <div v-for="(it, i) of events.orphan"
           :key="it.tradeEvent.id">
        <OrphanEvent :event="it"
                     :isFirst="true"
                     :isLast="true" />
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
