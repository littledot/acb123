<script setup lang='ts'>
import * as v from 'vue'
import * as t from '../type'
import * as s from '../symbol'
import * as u from '../util'

// https://github.com/JamesCoyle/vue-icon/blob/master/lib/svg-icon.vue

const props = defineProps<{
  path: string
}>()

</script>
<template>
  <svg aria-hidden="true"
       focusable="false"
       role="img"
       xmlns:svg="http://www.w3.org/2000/svg"
       xmlns="http://www.w3.org/2000/svg"
       x="0"
       y="0"
       width="100%"
       height="100%"
       viewBox="0 0 24 24">
    <path :d="path">
    </path>
  </svg>
</template>
