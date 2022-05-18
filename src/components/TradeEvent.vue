<script setup lang='ts'>
import * as v from 'vue'
import _ from 'lodash'
import * as t from './type'
import * as s from './symbol'
import * as u from './util'
import { createVNodeCall } from '@vue/compiler-core'

const props = defineProps<{
  event: t.ReportItem
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

  return {
    title: `${date}: ${action} ${trade.shares} shares`,
    showForex: isForex,
    forexPrice: trade.price.format(),
    forexOutlay: trade.outlay.format(),
    cadPrice: cad?.price.format(),
    cadOutlay: cad?.outlay.format(),
    cadTotal: total?.format(),

    acb: acb ? {
      shares: u.fmtNum(acb.shares),
      cost: acb.cost.format(),
      acb: acb.acb.format(),
    } : null,
  }
})

</script>
<template>
  <div class="flex flex-start items-center">
    <div class="bg-blue-600 w-4 h-4 flex items-center justify-center rounded-full -ml-2 mr-3 -mt-2"></div>
    <h4 class="text-gray-800 font-semibold text-xl -mt-2">{{ ui.title }}</h4>
  </div>
  <div class="ml-6 mb-6 pb-6">
    <div v-if="ui.showForex"
         class="grid grid-cols-3">
      <div class="text-left">
        Price:{{ ui.forexPrice }}
      </div>
      <div class="text-left col-span-2">
        Outlay:{{ ui.forexOutlay }}
      </div>
    </div>
    <div class="grid grid-cols-3">
      <div class="text-left">
        Price:{{ ui.cadPrice }}
      </div>
      <div class="text-left">
        Outlay:{{ ui.cadOutlay }}
      </div>
      <div class="text-left">
        Total:{{ ui.cadTotal }}
      </div>
    </div>

    <div class="grid grid-cols-3">
      <div class="text-left">
        Total Cost:{{ ui.acb?.cost }}
      </div>
      <div class="text-left">
        Total Shares:{{ ui.acb?.shares }}
      </div>
      <div class="text-left">
        ACB:{{ ui.acb?.acb }}
      </div>
    </div>
  </div>
</template>
