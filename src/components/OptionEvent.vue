<script setup lang='ts'>
import Icon from '@c/core/Icon.vue'
import Popper from '@c/core/Popper.vue'
import { mdiAlert, mdiPencil } from '@mdi/js'
import { capitalize } from 'lodash'
import * as v from 'vue'
import FxMetric from '@c/core/FxMetric.vue'
import Metric from '@c/core/Metric.vue'
import EditTradeModal from '@c/EditTradeModal.vue'
import * as t from '@m/reportItem'
import * as u from '@m/util'

let props = defineProps<{
  event: t.ReportItem,

  isFirst: boolean,
  isLast: boolean,
}>()

let showEditModal = v.ref(false)
let isHover = v.ref(false)

const ui = v.computed(() => {
  let { tradeEvent: trade, tradeValue: cad, optAcb: acb, optCg: cg, warn: warn } = props.event
  let option = trade.options

  let isForex = v.toRaw(trade.priceFx.currency) !== 'CAD'
    || v.toRaw(trade.outlayFx.currency) !== 'CAD'

  let total = cad?.price.multiply(trade.shares).add(cad.outlay)

  return {
    title: `${u.fmt(trade.date)}: ${capitalize(trade.action)} ${trade.shares} options`,
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
      shares: u.signNumFmt.format(acb.shares),
      sharesColor: `text-${acb.shares < 0 ? 'red' : 'green'}-600`,
      totalShares: u.fmt(acb.accShares),
      cost: acb.cost.format({ pattern: `+!#` }),
      costColor: `text-${acb.cost.value < 0 ? 'red' : 'green'}-600`,
      totalCost: acb.accCost.format(),
      acb: acb.acb.format(),
      showNegativeSharesAlert: acb.accShares < 0,
    } : null,

    cg: cg ? {
      gains: cg.gains.format({ pattern: `+!#` }),
      gainsColor: `text-${cg.gains.value < 0 ? 'red' : 'green'}-600`,
      totalGains: cg.yearGains.format(),
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
       class="flex flex-col"
       @dblclick="showEditModal = true"
       @mouseover="isHover = true"
       @mouseleave="isHover = false">

    <div id="trade-title"
         class="flex flex-row items-center">

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
           class="flex flex-row flex-1 gap-x-4 items-center ml-2">
        <div class="flex flex-row flex-[3] items-center">
          <h4 class="text-left text-gray-800 font-semibold text-xl">
            {{ ui.title }}</h4>
          <Icon :path="mdiPencil"
                class="w-6 h-6 ml-2 fill-current"
                :class="{ hidden: !(isHover || showEditModal) }"
                @click="showEditModal = true" />
        </div>
      </div>
    </div>

    <div id="trade-body"
         class="flex flex-row">
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

        <div v-if="ui.acb"
             class="col-[4/5] row-[1/2] flex flex-col justify-end text-right">
          <span class="text-l"
                :class="ui.acb.costColor">{{ ui.acb.cost }}</span>
          <span class="text-xl">{{ ui.acb.totalCost }}</span>
        </div>

        <div v-if="ui.acb"
             class="col-[5/6] row-[1/2] flex flex-col justify-end text-right">
          <span class="text-l"
                :class="ui.acb.sharesColor">{{ ui.acb.shares }}</span>
          <div class="flex flex-row justify-end items-center">
            <Popper v-if="ui.acb.showNegativeSharesAlert">
              <Icon :path="mdiAlert"
                    class="w-6 h-6 mx-1 fill-yellow-500" />
              <template #pop>
                <p class="text-left">Negative shares detected.</p>
                <p>Some trades may be missing and calculations may not be accurate.</p>
              </template>
            </Popper>
            <span class="text-xl">{{ ui.acb.totalShares }}</span>
          </div>
        </div>

        <div class="col-[6/7] row-[1/2] flex flex-col justify-end text-right">
          <span class="text-xl">{{ ui.acb?.acb }}</span>
        </div>

        <div v-if="ui.cg"
             class="col-[7/8] row-[1/2] flex flex-col justify-end text-right">
          <span class="text-l"
                :class="ui.cg.gainsColor">{{ ui.cg.gains }}</span>
          <span class="text-xl">{{ ui.cg.totalGains }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
</style>
