<script setup lang='ts'>
import * as v from 'vue'
import _ from 'lodash'
import * as t from './type'
import * as s from './symbol'
import * as u from './util'
import { createVNodeCall } from '@vue/compiler-core'
import { mdiInformationOutline, mdiPencilOutline } from '@mdi/js'
import Popper from "./core/Popper.vue"
import Svg from './core/Svg.vue'

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
  let cg = props.event.cg

  return {
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
      shares: u.fmtNum(acb.shares),
      cost: acb.cost.format(),
      totalCost: acb.totalCost.format(),
      acb: acb.acb.format(),
    } : null,

    cg: cg ? {
      gains: cg.gains.format(),
      totalGains: cg.totalGains.format(),
    } : null,
  }
})

</script>
<template>
  <div class="flex flex-start items-center">
    <div class="bg-blue-600 w-4 h-4 flex items-center justify-center rounded-full -ml-2 mr-3 -mt-2"></div>
    <h4 class="text-gray-800 font-semibold text-xl -mt-2">{{ ui.title }}</h4>
  </div>
  <div class="flex flex-start items-end
              ml-6 mb-6 pb-6">
    <div class="w-1/3">
      <div v-if="ui.showForex"
           class="grid grid-cols-3">
        <div class="text-left">
          Price:{{ ui.forexPrice }} (1:{{ ui.forexPriceRate }})
        </div>
        <div class="text-left col-span-2">
          Outlay:{{ ui.forexOutlay }} (1:{{ ui.forexOutlayRate }})
        </div>
      </div>
      <div class="grid grid-cols-3">
        <div class="text-left">
          <Popper>
            Price:{{ ui.cadPrice }}
            <Svg :path="mdiInformationOutline"></Svg>
            <template #content>
              1 USD = {{ ui.forexPriceRate }} CAD
            </template>
          </Popper>
        </div>
        <div class="text-left">
          Outlay:{{ ui.cadOutlay }}
        </div>
        <div class="text-left">
          Total:{{ ui.cadTotal }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 w-1/3">
      <div class="text-left">
        Cost:{{ ui.acb?.cost }}
      </div>
      <div class="text-left">
        Total Cost:{{ ui.acb?.totalCost }}
      </div>
      <div class="text-left">
        Total Shares:{{ ui.acb?.shares }}
      </div>
      <div class="text-left">
        ACB:{{ ui.acb?.acb }}
      </div>
    </div>

    <div class="grid grid-cols-3 w-1/3">
      <div class="text-left">
        Gains:{{ ui.cg?.gains }}
      </div>
      <div class="text-left">
        Total Gains:{{ ui.cg?.totalGains }}
      </div>
    </div>
  </div>
</template>
