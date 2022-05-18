<script setup lang='ts'>
import * as v from 'vue'
import * as t from './type'
import * as s from './symbol'
import * as u from './util'
import money from 'currency.js'

const props = defineProps<{
  price: money
  outlay: money
  amount: money
}>()

const ui = v.computed(() => {

})

</script>
<template>
  <p class="text-gray-700 mt-2 mb-4">{{ ui.forexVal }}</p>
</template>
