<script setup lang='ts'>
import * as u from '@comp/util'
import * as v from 'vue'

let props = defineProps<{
  hint?: string,
  maxLen?: number,

  modelValue?: number,
}>()
let emits = defineEmits({
  'update:modelValue': (it: number, event: Event) => true,
})

function onInput(event: Event) {
  let target = event.target as HTMLInputElement
  if (!target) return

  if (target.value == '') { // '--1', '++1' yields empty string
    emits('update:modelValue', NaN, event)
    return
  }

  target.value = target.value.slice(0, props.maxLen)

  let value = +target.value
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
