<script setup lang='ts'>
import * as v from 'vue'
import _ from 'lodash'
import * as t from './type'
import * as s from './symbol'
import * as u from './util'
import { createVNodeCall } from '@vue/compiler-core'
import { mdiInformationOutline, mdiPencilOutline, mdiClose, mdiEqual } from '@mdi/js'
import Metric from './core/Metric.vue'
import FxMetric from './core/FxMetric.vue'

const props = defineProps<{
  event: t.ReportItem
  showHeader: boolean,
  showTimeline: boolean,
}>()

const ui = v.computed(() => {
  let trade = props.event.tradeEvent
  let action = _.capitalize(trade.action)
  let date = trade.date.toISODate()


  let isForex = v.toRaw(trade.price.currency) !== t.CAD
    || v.toRaw(trade.outlay.currency) !== t.CAD

  let cad = props.event.tradeValue
  let total = cad?.price.multiply(trade.shares).add(cad.outlay)

  let acb = props.event.acb
  let cg = props.event.cg

  return {
    showHeader: props.showHeader ? ['block'] : ['hidden'],
    showTimeline: props.showTimeline ? ['visible'] : ['invisible'],
    title: `${date}: ${action} ${trade.shares} shares`,
    showForex: isForex,
    forexPrice: trade.price.format(),
    forexPriceRate: cad?.priceForex,
    forexOutlay: trade.outlay.format(),
    forexOutlayRate: cad?.outlayForex,
    cadPrice: cad?.price.format(),
    cadOutlay: cad?.outlay.format(),
    cadTotal: total?.format(),

    acb: acb ? {
      class: ['visible'],
      shares: u.fmtNum(acb.shares),
      cost: acb.cost.format(),
      totalCost: acb.totalCost.format(),
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
  <div class="flex flex-col"
       data-bs-toggle="modal"
       data-bs-target="#staticBackdrop">
    <div class="flex flex-row items-center">
      <div class="bg-blue-600 w-5 h-5 rounded-full" />
      <div class="flex flex-row flex-1 gap-x-4 items-center">
        <h4 class="flex-3 text-left text-gray-800 font-semibold text-xl">{{ ui.title }}</h4>
        <p class="col-header"
           :class="ui.showHeader">Cost</p>
        <p class="col-header"
           :class="ui.showHeader">Accumulated Cost</p>
        <p class="col-header"
           :class="ui.showHeader">Accumulated Shares</p>
        <p class="col-header"
           :class="ui.showHeader">ACB</p>
        <p class="col-header"
           :class="ui.showHeader">Capital Gains</p>
        <p class="col-header"
           :class="ui.showHeader">Acc. Capital Gains</p>
      </div>
    </div>
    <div class="flex flex-row">
      <div class="bg-blue-600 w-1 mx-2 -my-2"
           :class="ui.showTimeline" />
      <div class="flex flex-row flex-1 gap-x-4">
        <div class="flex flex-row flex-3 gap-x-6">
          <FxMetric label="Price"
                    :value="ui.forexPrice"
                    :value2="ui.cadPrice"
                    :fx-value="ui.forexPriceRate" />
          <FxMetric label="Outlay"
                    :value="ui.forexOutlay"
                    :value2="ui.cadOutlay"
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
.col-header {
  flex: 1;
  text-align: left;
  font-weight: 600;
}
</style>
