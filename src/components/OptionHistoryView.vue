<script setup lang='ts'>
import { OptionHistory } from '@store/tradeEvent'
import money from 'currency.js'
import { DateTime } from 'luxon'
import { v4 } from 'uuid'
import * as v from 'vue'
import ExpiredOptionsHintView from './ExpiredOptionsHintView.vue'
import OptionEvent from './OptionEvent.vue'
import { sumShares } from './type'

let props = defineProps<{
  history: OptionHistory
}>()
let emits = defineEmits({})

let ui = v.computed(() => {
  let oh = props.history
  let expiredOpt = hasExpiredOptions(oh)

  return {
    expiredHint: expiredOpt > 0 ? {
      ...oh.trades[0].tradeEvent,
      id: v4(),
      date: oh.contract.expiryDate,
      settleDate: oh.contract.expiryDate,
      action: 'expire',
      shares: sumShares(oh.trades),
      price: money(0),
      outlay: money(0),
      raw: undefined,
    } : undefined
  }
})

function hasExpiredOptions(oh: OptionHistory): number {
  if (DateTime.now() <= oh.contract.expiryDate) {
    return 0
  }

  return sumShares(oh.trades)
}

</script>

<template>
  <OptionEvent v-for="(it, i) of history.trades"
               :key="it.tradeEvent.id"
               :event="it"
               :isFirst="i === 0"
               :isLast="i === history.trades.length - 1" />
  <ExpiredOptionsHintView v-if="ui.expiredHint"
                          :history="history"
                          :event="ui.expiredHint" />
</template>
<style scoped>
</style>
