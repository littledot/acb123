<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from '@comp/symbol'
import * as u from '@comp/util'

const props = defineProps<{
  hint?: string
  maxLength?: number
}>()

function onInput(event: Event) {
  let target = event.target as HTMLInputElement
  if (!target) return

  if (props.maxLength) {
    target.value = target.value.slice(0, props.maxLength)
  }
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
                bg-white bg-clip-padding
                border border-solid border-gray-300
                rounded
                transition
                ease-in-out
                m-0
                focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
         type="number"
         @input="onInput"
         :placeholder="hint" />
</template>
<style scoped>
</style>
