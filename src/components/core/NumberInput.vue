<script setup lang='ts'>
import * as u from '@comp/util'

let props = defineProps({
  hint: String,
  min: Number,
  max: Number,
  maxLen: Number,

  modelValue: Number,
})
let emits = defineEmits({
  'update:modelValue': (it: number, event: Event) => true,
})

function onInput(event: Event) {
  let target = event.target as HTMLInputElement
  if (!target) return

  target.value = target.value.slice(0, props.maxLen)

  let value = +target.value
  value = Math.min(value, props.max ?? value)
  value = Math.max(value, props.min ?? value)

  target.value = '' + value
  console.log('numInput', value)
  emits('update:modelValue', value, event)
}

</script>
<template>
  <input class="form-control
                block
                w-full
                px-3
                py-1.5
                text-base
                font-normal
                text-gray-700
                bg-white disabled:bg-gray-100 
                bg-clip-padding
                border border-solid border-gray-300
                rounded
                transition
                ease-in-out
                m-0
                focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
                "
         type="number"
         @input="onInput"
         v-model="modelValue"
         :placeholder="hint" />
</template>
<style scoped>
</style>
