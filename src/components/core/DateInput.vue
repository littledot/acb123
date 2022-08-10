<script setup lang='ts'>
import * as u from '@m/util'
import { DateTime } from 'luxon'
import * as v from 'vue'
import NumberInput from '@c/core/NumberInput.vue'
import SelectInput from '@c/core/SelectInput.vue'

let props = defineProps<{
  modelValue?: DateTime,
}>()
let emits = defineEmits({
  'update:modelValue': (it: DateTime, event: Event) => true
})

let dayRef = v.ref<number>()
let monthRef = v.ref<number>()
let yearRef = v.ref<number>()

v.watchEffect(() => {
  let m = props.modelValue
  dayRef.value = m?.day
  monthRef.value = m?.month
  yearRef.value = m?.year
})

function onInputDate(event: Event) {
  let day = dayRef.value!
  let month = monthRef.value!
  let year = yearRef.value!

  // Not all fields set? Don't emit event
  if (u.isUndef(day) || u.isUndef(month) || u.isUndef(year)) return

  let dt = DateTime.local(year, month, day)
  console.log('dateInput', day, month, year, dt)

  emits('update:modelValue', dt, event)
}

</script>
<template>
  <div class="flex flex-row">
    <NumberInput class="flex-1"
                 hint="Year"
                 :maxLen="4"
                 v-model="yearRef"
                 @update:modelValue="(it, ev) => onInputDate(ev)" />
    <SelectInput class="flex-1"
                 :options="u.months"
                 v-model="monthRef"
                 @update:modelValue="(it, ev) => onInputDate(ev)" />
    <NumberInput class="flex-1"
                 hint="Day"
                 :maxLen="2"
                 v-model="dayRef"
                 @update:modelValue="(it, ev) => onInputDate(ev)" />
  </div>
</template>
<style scoped>
</style>
