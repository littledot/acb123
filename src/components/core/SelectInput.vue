<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from '@comp/symbol'
import * as u from '@comp/util'

const props = defineProps<{
  selectedId?: string
  options?: Map<string, string> // ID <> value
}>()

const emits = defineEmits({
  select: (id: string) => true
})

let selectedId = v.ref()

let selectedValue = v.computed(() => props.selectedId ?
  props.options?.get(props.selectedId) : null)

function onChange(event: Event) {
  emits('select', selectedId.value)
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
          v-model="selectedId"
          @change="onChange"
          aria-label="Default select example">
    <option v-for="[key, val] of options"
            :value="key">
      {{ val }}
    </option>
  </select>
</template>
<style scoped>
</style>
