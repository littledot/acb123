<script setup lang='ts'>
import * as v from 'vue'
import { defineComponent } from "vue"
import Popper from "vue3-popper"

// https://valgeirb.github.io/vue3-popper/guide/getting-started.html

// const props = defineProps<{
//   props: string
// }>() 
</script>

<template>
  <!-- Hardcoded "hover", "openDelay" and "closeDelay" -->
  <Popper v-bind="$attrs"
          hover
          openDelay="200"
          closeDelay="100">
    <slot />
    <template #content="props">
      <slot name="pop"
            v-bind="props" />
    </template>
  </Popper>
</template>

<style>
:root {
  --popper-theme-background-color: #fff;
  --popper-theme-background-color-hover: #fff;
  --popper-theme-text-color: inherit;
  --popper-theme-border-width: 1px;
  --popper-theme-border-style: solid;
  --popper-theme-border-color: #eeeeee;
  --popper-theme-border-radius: 6px;
  --popper-theme-padding: 16px;
  --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25)
}
</style>
