<script setup lang='ts'>
import NumberInput from '@comp/core/NumberInput.vue'
import SelectInput from '@comp/core/SelectInput.vue'
import * as u from '@comp/util'
import { useFxStore } from '@store/fx'
import { Fx } from '@store/tradeEvent'
import { DateTime } from 'luxon'
import * as v from 'vue'

let props = defineProps<{
  date?: DateTime,
  modelValue?: Fx,
}>()
let emits = defineEmits({
  'update:modelValue': (it: Fx, event: Event) => true,
})

let fxStore = useFxStore()

let currencyRef = v.ref<string>()
let rateRef = v.ref<number>()

let uiRef = v.ref<{
  err?: string
}>({})

v.watchEffect(() => {
  console.log('watchEffect')
  let m = props.modelValue
  currencyRef.value = m?.currency
  rateRef.value = m?.rate
  resolveRate(props.date)
})

async function resolveRate(date?: DateTime) {
  let currency = currencyRef.value
  u.log('FxInput', { 'cur': currency, 'date': date })
  let ui: any = {}

  if (date && currency && currency != 'custom') {
    rateRef.value = await fxStore.getRate2(currency, date)
      .catch((e) => {
        u.err('fx.getRate() failed.', e)
        ui.err = `Failed to query ${currency} exchange rate on ${props.date?.toISODate()}. Please enter it manually.`
        return undefined
      })
  }

  uiRef.value = ui
}


async function onChange(event: Event) {
  await resolveRate(props.date)
  emitEvent(event)
}

function onInputRate(event: Event) {
  currencyRef.value = 'custom'
  emitEvent(event)
}

function emitEvent(event: Event) {
  if (!currencyRef.value || u.isUndef(rateRef.value)) return

  let fx = { currency: currencyRef.value, rate: rateRef.value! }
  console.log('FxInput', fx, event)
  emits('update:modelValue', fx, event)
}

</script>
<template>
  <div class="flex flex-col">
    <div class="flex flex-row">
      <SelectInput v-model="currencyRef"
                   @update:modelValue="(_, ev) => onChange(ev)"
                   :options="new Map([
                     ['CAD', 'Canadian Dollar'],
                     ['USD', 'US Dollar'],
                     ['custom', 'Custom'],
                   ])" />
      <NumberInput v-model="rateRef"
                   @update:modelValue="(_, ev) => onInputRate(ev)" />
    </div>
    <div v-if="uiRef.err"
         class="text-left text-sm text-red-500">
      {{ uiRef.err }}
    </div>
  </div>
</template>
<style scoped>
</style>
