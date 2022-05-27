<script setup lang='ts'>
import * as v from 'vue'
import * as t from '../type'
import * as s from '../symbol'
import * as u from '../util'
import Popper from './Popper.vue'

const props = defineProps<{
  label?: string,
  value?: string | number,
  labelTooltip?: string,
  labelTooltipPlacement?: string,
}>()

let labelPopper = v.computed(() => {

})

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
         class="text-2xl font-normal">
      <span>{{ value }}</span>
    </div>
  </div>
</template>
