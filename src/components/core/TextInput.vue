<script setup lang='ts'>
import * as u from '@m/util'

let props = defineProps<{
  hint?: string
  inputType?: string
  maxLength?: number

  modelValue?: string
}>()
let emits = defineEmits({
  'update:modelValue': (it: string) => true,
})

let vModel = u.vueModel(props, emits, 'modelValue')

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
         :type="inputType ?? 'text'"
         :maxlength="maxLength"
         :placeholder="hint"
         v-model="vModel" />
</template>
<style scoped>
</style>
