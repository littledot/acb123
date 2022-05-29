<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from '@comp/symbol'
import * as u from '@comp/util'
import SelectInput from './SelectInput.vue'
import NumberInput from './NumberInput.vue'

const props = defineProps<{
  hint?: string
  maxLength?: number
}>()

const currencyOpt = new Map([
  ['CAD', 'Canadian Dollar'],
  ['USD', 'US Dollar'],
  ['custom', 'Custom Currency'],
])

let onSelectCurrency = v.ref()

let ui = v.computed(() => {
  return {
    disabled: onSelectCurrency.value !== 'custom',
    value: Math.random()
  }
})

</script>
<template>
  <div class="flex flex-row">
    <SelectInput :options="currencyOpt"
                 v-model="onSelectCurrency" />
    <NumberInput :disabled="ui.disabled"
                 :value="ui.value" />
  </div>
</template>
<style scoped>
</style>
