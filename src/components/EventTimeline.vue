<script setup lang='ts'>
import { ref, computed, inject, onMounted, onRenderTriggered } from 'vue'
import * as v from 'vue'
import * as t from './type'
import * as s from './symbol'
import * as u from './util'
import TradeEvent from './TradeEvent.vue'

let props = defineProps<{
  events: t.ReportItem[]
}>()
let emits = defineEmits({})

</script>

<template>
  <ol>
    <li v-for="(it, i) of events"
        :key="it.tradeEvent.id">
      <TradeEvent :event="it"
                  :isFirst="i === 0"
                  :isLast="i === events.length - 1" />
    </li>
  </ol>
</template>
<style scoped>
.timeline-grid {
  display: grid;
  grid-template-columns: [price-l] min-content [price-r cost-l] min-content [cost-r shares-l] min-content [shares-r acb-l] min-content [acb-r cg-l] min-content [cg-r];
  grid-auto-rows: auto;
}
</style>
