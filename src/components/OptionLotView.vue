<script setup lang='ts'>
import { OptionLot } from '@m/tradeEvent'
import money from 'currency.js'
import { DateTime } from 'luxon'
import { v4 } from 'uuid'
import * as v from 'vue'
import ExpiredOptionsHintView from '@c/ExpiredOptionsHintView.vue'
import OptionEvent from '@c/OptionEvent.vue'
import { sumShares } from '@/modules/tradeNode'

let props = defineProps<{
  optionLot: OptionLot
}>()
let emits = defineEmits({})

let ui = v.computed(() => {
  let ol = props.optionLot
  let expiredOpt = hasExpiredOptions(ol)

  return {
    expiredHint: expiredOpt > 0 ? {
      ...ol.trades[0].tradeEvent,
      id: v4(),
      date: ol.contract.expiryDate,
      settleDate: ol.contract.expiryDate,
      action: 'expire',
      shares: sumShares(ol.trades),
      price: money(0),
      outlay: money(0),
      raw: void 0,
    } : void 0
  }
})

function hasExpiredOptions(oh: OptionLot): number {
  if (DateTime.now() <= oh.contract.expiryDate) {
    return 0
  }

  return sumShares(oh.trades)
}

</script>

<template>
  <OptionEvent v-for="(it, i) of optionLot.trades"
               :key="it.tradeEvent.id"
               :event="it"
               :isFirst="i === 0"
               :isLast="i === optionLot.trades.length - 1" />
  <ExpiredOptionsHintView v-if="ui.expiredHint"
                          :option-lot="optionLot"
                          :event="ui.expiredHint" />
</template>
<style scoped>
</style>
