<script setup lang='ts'>
import * as u from '@m/util'

let props = defineProps<{
  accept?: string

  modelValue?: File
}>()
let emits = defineEmits({
  'update:modelValue': (it: File) => true,
})

function onChange(event: Event) {
  (event.target as HTMLInputElement)
    .let(it => it.files?.item(0))
    ?.let(it => emits('update:modelValue', it))
}

</script>
<template>
  <input class="form-control
                block
                w-full
                px-2
                py-1
                text-sm
                font-normal
                text-gray-700
                bg-white bg-clip-padding
                border border-solid border-gray-300
                rounded
                transition
                ease-in-out
                m-0
                focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
         type="file"
         @change="onChange"
         :accept="accept" />
</template>
<style scoped>
</style>
