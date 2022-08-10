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
  <div class="flex flex-col place-items-start justify-between">
    <Popper :content="labelTooltip"
            :placement="labelTooltipPlacement"
            :disabled="!!!labelTooltip">
      <div id="label"
           class="text-sm font-medium">
        {{ label }}
      </div>
    </Popper>
    <div id="value"
         class="flex flex-row center-items">
      <span class="text-xl">{{ value }}</span>
      <slot name="valueRight" />
    </div>
  </div>
</template>
