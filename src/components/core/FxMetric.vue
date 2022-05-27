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
          <div id="label"
               class="text-sm font-semibold">
            {{ label }}
          </div>
        </Popper>
        <div id="value"
             class="text-m font-normal">
          <span>{{ value }}</span>
        </div>
      </div>

      <Icon :path="mdiClose" />

      <div id="fx-label"
           class="flex flex-col place-items-start">
        <Popper :content="labelTooltip"
                :placement="labelTooltipPlacement"
                :disabled="!!!labelTooltip">
          <div id="label"
               class="text-sm font-medium">
            FX Rate
          </div>
        </Popper>
        <div id="value"
             class="text-m font-normal">
          <span>{{ fxValue }}</span>
        </div>
      </div>
    </div>

    <div id="value"
         class="text-2xl font-normal">
      <span>{{ value2 }}</span>
    </div>

  </div>
</template>
