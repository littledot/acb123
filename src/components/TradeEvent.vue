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
import { mdiAlert, mdiPencil } from '@mdi/js'
import Popper from '@comp/core/Popper.vue'
import Icon from '@comp/core/Icon.vue'
import CalcValue from './core/CalcValue.vue'

let props = defineProps<{
  event: t.ReportItem,

  isFirst: boolean,
  isLast: boolean,
}>()

let showEditModal = v.ref(false)
let isHover = v.ref(false)

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
      shares: u.signNumFmt.format(acb.shares),
      totalShares: u.fmtNum(acb.accShares),
      cost: acb.cost.format({ pattern: `+!#` }),
      totalCost: acb.accCost.format(),
      acb: acb.acb.format(),
      showNegativeSharesAlert: acb.accShares < 0,
    } : {
      class: ['invisible'],
    },

    cg: cg ? {
      gains: cg.gains.format({ pattern: `+!#` }),
      totalGains: cg.totalGains.format(),
    } : null,
  }
})

</script>
<template>
  <Teleport to="body">
    <EditTradeModal :trade="event.tradeEvent"
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
             class="w-5 h-5 m-auto bg-blue-600 rounded-full" />
        <div id="line"
             class="absolute
                    w-1 h-full mx-2
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
           class="bg-blue-600 w-1 mx-2"
           :class="{ invisible: isLast }" />
      <div id="body-content"
           class="flex flex-row flex-1 gap-x-4 ml-2 mt-2 mb-4">
        <!-- <div class="flex flex-col">
          <div id="trade-subtotal"
               class="flex flex-row flex-[3] gap-x-8">
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
          <div class="h-0.5 bg-gray-800" />
          <div class="flex flex-row justify-end">
            <Metric label="Total"
                    :value="ui.cadTotal" />
          </div>
        </div> -->

        <div id="trade-subtotal"
             class="price-grid gap-x-4 gap-y-2">
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
          <div class="col-[1/3] row-[2/3] h-0.5 bg-gray-600" />
          <Metric class="col-[2/3] row-[3/4]"
                  label="Total"
                  :value="ui.cadTotal" />

          <CalcValue class="col-[3/4] row-[1/2]"
                     :value="ui.acb?.cost" />
          <div class="col-[3/4] row-[2/3] h-0.5 bg-gray-600" />
          <CalcValue class="col-[3/4] row-[3/4]"
                     :value="ui.acb?.totalCost" />

          <CalcValue class="col-[4/5] row-[1/2]"
                     :value="ui.acb?.shares" />
          <div class="col-[4/5] row-[2/3] h-0.5 bg-gray-600" />
          <CalcValue class="col-[4/5] row-[3/4]"
                     :value="ui.acb?.totalShares" />

          <!-- <CalcValue class="col-[5/6] row-[1/2]"
                  :value="ui.acb?.shares" />
          <div class="col-[5/6] row-[2/3] h-0.5 bg-gray-600" /> -->
          <CalcValue class="col-[5/6] row-[3/4]"
                     :value="ui.acb?.acb" />

          <template v-if="ui.cg">
            <CalcValue class="col-[6/7] row-[1/2]"
                       :value="ui.cg?.gains" />
            <div class="col-[6/7] row-[2/3] h-0.5 bg-gray-600" />
            <CalcValue class="col-[6/7] row-[3/4]"
                       :value="ui.cg?.totalGains" />
          </template>
        </div>

        <!-- <Metric class="flex-1"
                :value="ui.acb?.cost" />
        <Metric class="flex-1"
                :value="ui.acb?.totalCost" />
        <Metric class="flex-1"
                :value="ui.acb?.shares">
          <template #valueRight>
            <div class="w-6 h-6"
                 :class="{ hidden: !ui.acb?.showNegativeSharesAlert }">
              <Popper>
                <Icon :path="mdiAlert"
                      class="w-6 h-6 ml-1 fill-yellow-500" />
                <template #pop>
                  <p class="text-left">Negative shares detected.</p>
                  <p>Some trades may be missing and calculations may not be accurate.</p>
                </template>
              </Popper>
            </div>
          </template>
        </Metric>
        <Metric class="flex-1"
                :value="ui.acb?.acb" />

        <Metric class="flex-1"
                :value="ui.cg?.gains" />
        <Metric class="flex-1"
                :value="ui.cg?.totalGains" /> -->
      </div>
    </div>
  </div>
</template>
<style scoped>
.price-grid {
  display: grid;
  grid-template-columns: repeat(6, 20ch);
  grid-auto-rows: auto;
}
</style>
