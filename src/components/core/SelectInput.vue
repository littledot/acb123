<script setup lang='ts'>
import * as v from 'vue'

let props = defineProps<{
  options?: Map<unknown, string> // ID <> value

  modelValue?: unknown,
}>()
let emits = defineEmits({
  'update:modelValue': (it: unknown) => true,
})

v.watch(() => props.modelValue, (init) => {
  emits('update:modelValue', init)
})


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
          aria-label="Selector">
    <option value=""
            disabled
            hidden>
      Fix for iOS
    </option>
    <option v-for="[id, option] of options"
            :value="id">
      {{ option }}
    </option>
  </select>
</template>
<style scoped>
</style>
