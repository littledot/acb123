<script setup lang='ts'>
import { mdiInformationOutline } from '@mdi/js'
import { useTradeStore } from '@m/stores/trade'
import { OptionLot, TradeEvent } from '@m/tradeEvent'
import * as v from 'vue'
import Icon from '@c/core/Icon.vue'

let props = defineProps<{
  optionLot: OptionLot,
  event: TradeEvent,
  modelValue?: any,
}>()
let emits = defineEmits({
  'update:modelValue': (it: any) => true,
})

let ui = v.computed(() => {
  return {

  }
})

async function insertExpiredEvent() {
  await useTradeStore().insertTradeAtIndex(props.event, props.optionLot.trades, props.optionLot.trades.length)
}

</script>
<template>
  <div id="trade-title"
       class="flex items-center">
    <Icon class="w-5 h-5 fill-blue-600"
          :path="mdiInformationOutline" />
    <div id="title-content"
         class="flex flex-1 gap-x-4 items-center ml-2"
         @click="insertExpiredEvent">
      <div class="flex flex-[3] items-center">
        <a class="link-primary text-left cursor-pointer">
          {{ event.shares }} options are past the contract's expiry date. Click to mark them as expired.</a>
      </div>
    </div>
  </div>
</template>
<style scoped>
</style>
