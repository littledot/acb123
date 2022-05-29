<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from '@comp/symbol'
import * as u from '@comp/util'
import TextInput from './TextInput.vue'
import SelectInput from './SelectInput.vue'
import NumberInput from './NumberInput.vue'

const props = defineProps<{
}>()

const months = new Map([
  ['1', 'January'],
  ['2', 'February'],
  ['3', 'March'],
  ['4', 'April'],
  ['5', 'May'],
  ['6', 'June'],
  ['7', 'July'],
  ['8', 'August'],
  ['9', 'September'],
  ['10', 'October'],
  ['11', 'November'],
  ['12', 'December'],
])

</script>
<template>
  <div class="flex flex-row">
    <NumberInput class="flex-1"
                 hint="Day"
                 :max-length="2"
                 min="1"
                 max="31" />
    <SelectInput class="flex-1"
                 :options="months" />
    <NumberInput class="flex-1"
                 hint="Year"
                 :max-length="4" />
  </div>
</template>
<style scoped>
</style>
