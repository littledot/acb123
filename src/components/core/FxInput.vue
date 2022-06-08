<script setup lang='ts'>
import NumberInput from '@comp/core/NumberInput.vue'
import SelectInput from '@comp/core/SelectInput.vue'
import * as u from '@comp/util'
import { useFxStore } from '@store/fx'
import { Fx } from '@store/tradeEventJson'
import { DateTime } from 'luxon'
import * as v from 'vue'

let props = defineProps<{
  date?: DateTime,
  modelValue?: Fx,
}>()
let emits = defineEmits({
  'update:modelValue': (it: Fx) => true,
})

const currencyOpt = new Map([
  ['CAD', 'Canadian Dollar'],
  ['USD', 'US Dollar'],
  ['custom', 'Other'],
])

let fxStore = useFxStore()

let currencyRef = v.ref(props.modelValue?.currency)
let rate = props.modelValue?.rate ?? -1
let rateRef = v.ref(rate > 0 ? rate : undefined)

let uiRef = v.ref<{
  err?: string
}>({})

v.watch([currencyRef, () => props.date], async ([currency, date]) => {
  u.log('FxInput', { 'cur': currency, 'date': date })
  let ui: any = {}

  if (props.date && currency && currency !== 'custom') {
    rateRef.value = await fxStore.getRate2(currency, props.date)
      .catch((e) => {
        u.err('fx.getRate() failed.', e)
        ui.err = `Failed to query ${currency} exchange rate on ${props.date?.toISODate()}. Please enter it manually.`
        return undefined
      })
  }

  uiRef.value = ui
})

v.watch(rateRef, (rate) => {
  if (!currencyRef.value || !rate) return
  let fx = { currency: currencyRef.value, rate: rate }
  emits('update:modelValue', fx)
})

</script>
<template>
  <div class="flex flex-col">
    <div class="flex flex-row">
      <SelectInput :options="currencyOpt"
                   v-model="currencyRef" />
      <NumberInput v-model="rateRef" />
    </div>
    <div v-if="uiRef.err"
         class="text-left text-sm text-red-500">
      {{ uiRef.err }}
    </div>
  </div>
</template>
<style scoped>
</style>
