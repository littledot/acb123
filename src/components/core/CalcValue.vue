<script setup lang='ts'>
import Popper from '@c/core/Popper.vue'

const props = defineProps<{
  label?: string,
  value?: string | number,
  labelTooltip?: string,
  labelTooltipPlacement?: string,
}>()

</script>
<template>
  <div class="flex-col place-items-end justify-between">
    <div id="label"
         class="text-sm font-medium">
      {{ label }}
    </div>
    <div id="value"
         class="flex center-items">
      <span class="text-xl">{{ value }}</span>
      <slot name="valueRight" />
    </div>
  </div>
</template>
