<script setup lang='ts'>
import questradeUrl from '@/assets/questrade.csv?url'
import { useTradeStore } from '@store/trade'
import { onMounted } from 'vue'
import EventTimeline from './EventTimeline.vue'

let tradeStore = useTradeStore()

onMounted(() => {
  tradeStore.importCsvFile(questradeUrl)
})

function showFirst(i: number) {
  return i == 0 ? ['show'] : ['collapse']
}

</script>

<template>
  <div id="accordionExample5"
       class="accordion">
    <div v-for="([security, events], i) of tradeStore.tradesBySecurity"
         :key="security"
         class="accordion-item bg-white border border-gray-200">
      <h2 :id="'heading' + i"
          class="accordion-header mb-0">
        <button class="accordion-button relative flex items-center w-full py-4 px-5 text-base text-gray-800 text-left bg-white border-0 rounded-none transition focus:outline-none"
                type="button"
                data-bs-toggle="collapse"
                :data-bs-target="'#collapse' + i"
                aria-expanded="false"
                aria-controls="collapseOne5">{{ security }}</button>
      </h2>
      <div :id="'collapse' + i"
           class="accordion-collapse collapse"
           :class="showFirst(i)"
           :aria-labelledby="'collapse' + i">
        <div class="accordion-body py-4 px-5">
          <EventTimeline :events="events" />
        </div>
      </div>
    </div>
  </div>
</template>
