<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from '@comp/symbol'
import * as u from '@comp/util'

let props = defineProps<{
  modelValue?: any
}>()
let emits = defineEmits({
  'update:modelValue': (it: any) => true,
})

</script>
<template>

</template>
<style scoped>
</style>
