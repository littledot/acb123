<script setup lang='ts'>
import { useTradeStore } from '@store/trade'
import { TradeEvent } from '@store/tradeEvent'
import _ from 'lodash'
import * as v from 'vue'
import FxMetric from './core/FxMetric.vue'
import Metric from './core/Metric.vue'
import EditTradeModal from './EditTradeModal.vue'
import * as t from './type'
import * as u from './util'

let props = defineProps<{
  event: t.ReportItem,

  isFirst: boolean,
  isLast: boolean,
}>()

let showEditModal = v.ref(false)

const ui = v.computed(() => {
  let trade = props.event.tradeEvent
  let action = _.capitalize(trade.action)
  let date = trade.date.toISODate()


  let isForex = v.toRaw(trade.priceFx.currency) !== 'CAD'
    || v.toRaw(trade.outlayFx.currency) !== 'CAD'

  let cad = props.event.tradeValue
  let total = cad?.price.multiply(trade.shares).add(cad.outlay)

  let acb = props.event.acb
  let cg = props.event.cg

  return {
    title: `${date}: ${action} ${trade.shares} shares`,
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

    acb: acb ? {
      class: ['visible'],
      shares: u.fmtNum(acb.shares),
      cost: acb.cost.format(),
      totalCost: acb.accCost.format(),
      acb: acb.acb.format(),
    } : {
      class: ['invisible'],
    },

    cg: cg ? {
      class: ['visible'],
      gains: cg.gains.format(),
      totalGains: cg.totalGains.format(),
    } : {
      class: ['invisible'],
    },
  }
})

</script>
<template>
  <Teleport to="body">
    <EditTradeModal :trade="event.tradeEvent"
                    :show="showEditModal"
                    @close="showEditModal = false" />
  </Teleport>

  <div v-bind="$attrs"
       class="flex flex-col"
       @click="showEditModal = true">

    <div id="trade-title"
         class="flex flex-row items-center">

      <div id="title-timeline"
           class="relative flex self-stretch">
        <div id="dot"
             class="w-5 h-5 m-auto bg-blue-600 rounded-full" />
        <div id="line"
             class="absolute
                    w-1 h-full mx-2
                    bg-blue-600"
             :class="{
               'h-1/2': isFirst || isLast,
               'top-1/2': isFirst, 'bottom-1/2': isLast,
             }" />
      </div>

      <div id="title-content"
           class="flex flex-row flex-1 gap-x-4 items-center ml-2">
        <h4 class="flex-[3] text-left text-gray-800 font-semibold text-xl">{{ ui.title }}</h4>
        <p class="flex-1 text-left font-semibold"
           :class="{ hidden: !isFirst }">Cost</p>
        <p class="flex-1 text-left font-semibold"
           :class="{ hidden: !isFirst }">Accumulated Cost</p>
        <p class="flex-1 text-left font-semibold"
           :class="{ hidden: !isFirst }">Accumulated Shares</p>
        <p class="flex-1 text-left font-semibold"
           :class="{ hidden: !isFirst }">ACB</p>
        <p class="flex-1 text-left font-semibold"
           :class="{ hidden: !isFirst }">Capital Gains</p>
        <p class="flex-1 text-left font-semibold"
           :class="{ hidden: !isFirst }">Acc. Capital Gains</p>
      </div>
    </div>

    <div id="trade-body"
         class="flex flex-row">
      <div id="body-timeline"
           class="bg-blue-600 w-1 mx-2"
           :class="{ invisible: isLast }" />
      <div id="body-content"
           class="flex flex-row flex-1 gap-x-4 ml-2 mt-2 mb-4">
        <div id="trade-subtotal"
             class="flex flex-row flex-[3] gap-x-6">
          <FxMetric label="Price"
                    :value="ui.forexPrice"
                    :value2="ui.cadPrice"
                    :fx-currency="ui.forexPriceCurrency"
                    :fx-value="ui.forexPriceRate" />
          <FxMetric label="Outlay"
                    :value="ui.forexOutlay"
                    :value2="ui.cadOutlay"
                    :fx-currency="ui.forexOutlayCurrency"
                    :fx-value="ui.forexOutlayRate" />
          <Metric label="Total"
                  :value="ui.cadTotal" />
        </div>

        <Metric class="flex-1"
                :value="ui.acb?.cost" />
        <Metric class="flex-1"
                :value="ui.acb?.totalCost" />
        <Metric class="flex-1"
                :value="ui.acb?.shares" />
        <Metric class="flex-1"
                :value="ui.acb?.acb" />

        <Metric class="flex-1"
                :value="ui.cg?.gains" />
        <Metric class="flex-1"
                :value="ui.cg?.totalGains" />
      </div>
    </div>
  </div>
</template>
<style scoped>
</style>
