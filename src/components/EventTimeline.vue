<script setup lang='ts'>
import TradeEvent from '@comp/TradeEvent.vue'
import * as t from '@comp/type'

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
