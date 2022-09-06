<script setup lang='ts'>
import * as v from 'vue'
import * as u from '@m/util'
import { isString } from 'lodash'

let props = defineProps<{
  options?: Map<unknown, u.SelectOption> // ID <> value

  modelValue?: unknown,
}>()
let emits = defineEmits({
  'update:modelValue': (it: unknown, event: Event) => true,
})

let uiOptions = v.computed(() => {
  let m = new Map<unknown, u.SelectVm>()

  for (let [k, v] of props.options?.entries() ?? []) {
    if (isString(v)) {
      m.set(k, { label: v })
    } else {
      m.set(k, v)
    }
  }
  return m
})

function onChange(event: Event) {
  let target = event.target as HTMLInputElement
  if (!target) return

  console.log('selectInput', props.modelValue)
  emits('update:modelValue', props.modelValue, event)
}

</script>
<template>
  <select class="form-select appearance-none
                  block
                  w-full
                  px-3
                  py-1.5
                  text-base
                  font-normal
                  text-gray-700
                  bg-white bg-clip-padding bg-no-repeat
                  border border-solid border-gray-300
                  rounded
                  transition
                  ease-in-out
                  m-0
                  focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          v-model="modelValue"
          @change="onChange"
          aria-label="Selector">
    <option value=""
            disabled
            hidden>
      Fix for iOS
    </option>
    <option v-for="[id, option] of uiOptions"
            :disabled="option.disabled"
            :hidden="option.hidden"
            :value="id">
      {{ option.label }}
    </option>
  </select>
</template>
<style scoped>
</style>
