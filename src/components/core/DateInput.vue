<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from '@comp/symbol'
import * as u from '@comp/util'
import SelectInput from './SelectInput.vue'
import NumberInput from './NumberInput.vue'
import { DateTime } from 'luxon'

let props = defineProps<{
  modelValue?: DateTime,
}>()
let emits = defineEmits({
  'update:modelValue': (it: DateTime) => true
})

let dayRef = v.ref<number>()
let monthRef = v.ref<number>()
let yearRef = v.ref<number>()

v.watch(() => props.modelValue, (init) => {
  if (!init) return
  dayRef.value = init.day
  monthRef.value = init.month
  yearRef.value = init.year
})

let ui = v.computed(() => {
  let day = dayRef.value
  let month = monthRef.value
  let year = yearRef.value

  console.log('DateInput', day, month, year)

  if (!day || !month || !year) { // Not all fields set? Don't judge yet
    return {}
  }

  let dt = DateTime.local(year, month, day)

  if (!dt.isValid) {
    return { err: dt.invalidExplanation }
  }
  if (dt > DateTime.now()) {
    return { err: 'You made a trade in the future? Can I borrow your time machine?' }
  }

  emits('update:modelValue', dt)
  return {}
})


</script>
<template>
  <div class="flex flex-col">
    <div class="flex flex-row">
      <NumberInput class="flex-1"
                   hint="Day"
                   :min="0"
                   :maxLen="2"
                   v-model="dayRef" />
      <SelectInput class="flex-1"
                   :options="u.months"
                   v-model="monthRef" />
      <NumberInput class="flex-1"
                   hint="Year"
                   :min="0"
                   :maxLen="4"
                   v-model="yearRef" />
    </div>
    <div v-if="ui.err"
         class="text-left text-sm text-red-500">
      {{ ui.err }}
    </div>
  </div>
</template>
<style scoped>
</style>
