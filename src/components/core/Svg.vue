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
       data-prefix="far"
       data-icon="arrow-alt-circle-up"
       class="w-4 h-4"
       role="img"
       xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 24 24">
    <path fill="currentColor"
          :d="path">
    </path>
  </svg>
</template>
