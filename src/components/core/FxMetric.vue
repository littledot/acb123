<script setup lang='ts'>
import * as v from 'vue'
import * as t from '../type'
import * as s from '../symbol'
import * as u from '../util'
import Popper from './Popper.vue'
import Icon from './Icon.vue'
import { mdiClose, mdiEqual } from '@mdi/js'

const props = defineProps<{
  label?: string,
  value?: string,
  value2?: string,
  fxCurrency?: string,
  fxValue?: number,
  labelTooltip?: string,
  labelTooltipPlacement?: string,
}>()

let labelPopper = v.computed(() => {

})

</script>
<template>
  <div class="flex flex-col place-items-start">
    <div class="flex flex-row items-center gap-x-1">
      <div class="flex flex-col place-items-start">
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
           class="flex flex-col place-items-start">
        <Popper :content="labelTooltip"
                :placement="labelTooltipPlacement"
                :disabled="!!!labelTooltip">
          <p id="label"
             class="text-sm">
            {{ fxCurrency }} FX
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
