<script setup lang='ts'>
import * as t from '@/modules/tradeNode'
import FxMetric from '@c/core/FxMetric.vue'
import Icon from '@c/core/Icon.vue'
import Metric from '@c/core/Metric.vue'
import * as u from '@m/util'
import { mdiPencil } from '@mdi/js'
import { capitalize } from 'lodash'
import * as v from 'vue'
import EditTradeModal from '@c/EditTradeModal.vue'

let props = defineProps<{
  event: t.TradeNode,

  isFirst: boolean,
  isLast: boolean,
}>()

let showEditModal = v.ref(false)
let isHover = v.ref(false)

const ui = v.computed(() => {
  let { tradeEvent: trade, tradeValue: cad, warn: warn } = props.event
  let action = capitalize(trade.action)
  let asset = trade.optionLot ? `options` : `shares`
  let date = u.fmt(trade.date)
  let total = cad?.price.multiply(trade.shares).add(cad.outlay)
  let isForex = v.toRaw(trade.priceFx.currency) !== 'CAD'
    || v.toRaw(trade.outlayFx.currency) !== 'CAD'
  let optContract = trade.optionLot?.contract

  return {
    title: `${date}: ${action} ${trade.shares} ${asset}`,
    showForex: isForex,
    forexPrice: trade.price.format(),
    forexPriceCurrency: trade.priceFx.currency,
    forexPriceRate: cad?.priceForex,
    forexOutlay: trade.outlay.format(),
    forexOutlayCurrency: trade.outlayFx.currency,
    forexOutlayRate: cad?.outlayForex,
    cadPrice: cad?.price.format(),
    cadOutlay: cad?.outlay.format(),
    cadTotal: total?.format(),

    contract: optContract ? {
      type: capitalize(optContract.type),
      expiryDate: u.fmt(optContract.expiryDate),
      strike: `${optContract.strikeFx.currency}$${optContract.strike} `,
    } : null,
  }
})

</script>
<template>
  <Teleport to="body">
    <EditTradeModal :trade="event"
                    :showDelete="true"
                    :show="showEditModal"
                    @hide="showEditModal = false" />
  </Teleport>

  <div v-bind="$attrs"
       class="flex-col"
       @dblclick="showEditModal = true"
       @mouseover="isHover = true"
       @mouseleave="isHover = false">

    <div id="trade-title"
         class="flex items-center">

      <div id="title-timeline"
           class="relative flex self-stretch">
        <div id="dot"
             class="w-3 h-3 m-auto bg-blue-600 rounded-full" />
        <div id="line"
             class="absolute
                    w-1 h-full mx-1
                    bg-blue-600"
             :class="{
               'h-1/2': isFirst || isLast,
               'top-1/2': isFirst, 'bottom-1/2': isLast,
               'hidden': isFirst && isLast, // Only item? hide line
             }" />
      </div>

      <div id="title-content"
           class="flex flex-1 gap-x-4 items-center ml-2">
        <div class="flex flex-[3] items-center">
          <h4 class="text-left text-gray-800 font-semibold">
            {{ ui.title }}</h4>
          <Icon :path="mdiPencil"
                class="w-6 h-6 ml-2 fill-current"
                :class="{ hidden: !(isHover || showEditModal) }"
                @click="showEditModal = true" />
        </div>
      </div>
    </div>

    <div id="trade-body"
         class="flex">
      <div id="body-timeline"
           class="bg-blue-600 w-1 mx-1"
           :class="{ invisible: isLast }" />

      <div id="body-content"
           class="event-grid flex-1 pl-2 mt-2 mb-4">
        <FxMetric class="col-[1/2] row-[1/2]"
                  label="Price"
                  :value="ui.forexPrice"
                  :value2="ui.cadPrice"
                  :fx-currency="ui.forexPriceCurrency"
                  :fx-value="ui.forexPriceRate" />
        <FxMetric class="col-[2/3] row-[1/2]"
                  label="Outlay"
                  :value="ui.forexOutlay"
                  :value2="ui.cadOutlay"
                  :fx-currency="ui.forexOutlayCurrency"
                  :fx-value="ui.forexOutlayRate" />
        <Metric class="col-[3/4] row-[1/2]"
                label="Total"
                :value="ui.cadTotal" />

        <div v-if="ui.contract"
             class="col-[4/8] row-[1/2] flex-col items-start">
          <p class="font-semibold">{{ ui.contract.type }} Option Details</p>
          <p><span class="font-semibold">Strke:</span> {{ ui.contract.strike }}</p>
          <p><span class="font-semibold">Expiry:</span> {{ ui.contract.expiryDate }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
</style>
