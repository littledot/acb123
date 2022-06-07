<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from '@comp/symbol'
import * as u from '@comp/util'
import SelectInput from './SelectInput.vue'
import NumberInput from './NumberInput.vue'
import { DateTime } from 'luxon'
import { useFxStore } from '@store/fx'

let props = defineProps<{
  date?: DateTime,
  modelValue?: t.Fx,
}>()
let emits = defineEmits({
  'update:modelValue': (it: t.Fx) => true,
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
