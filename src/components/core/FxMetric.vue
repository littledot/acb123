<script setup lang='ts'>
import { mdiClose } from '@mdi/js'
import Icon from '@c/core/Icon.vue'
import Popper from '@c/core/Popper.vue'

let props = defineProps<{
  label?: string,
  value?: string,
  value2?: string,
  fxCurrency?: string,
  fxValue?: number,
  labelTooltip?: string,
  labelTooltipPlacement?: string,
}>()


</script>
<template>
  <div class="flex-col place-items-start">
    <div class="flex items-center gap-x-1">
      <div class="flex-col place-items-start">
        <Popper :content="labelTooltip"
                :placement="labelTooltipPlacement"
                :disabled="!!!labelTooltip">
          <p id="label"
             class="font-semibold">
            {{ label }}
          </p>
        </Popper>
        <div id="value"
             class="text-m font-normal">
          <span>{{ value }}</span>
        </div>
      </div>

      <Icon class="w-4 h-4"
            :path="mdiClose" />

      <div id="fx-label"
           class="flex-col place-items-start">
        <Popper :content="labelTooltip"
                :placement="labelTooltipPlacement"
                :disabled="!!!labelTooltip">
          <p id="label"
             class="text-sm">
            {{ fxCurrency }}
          </p>
        </Popper>
        <p id="value"
           class="">
          <span>{{ fxValue }}</span>
        </p>
      </div>
    </div>

    <div id="value"
         class="text-xl">
      <span>{{ value2 }}</span>
    </div>

  </div>
</template>
