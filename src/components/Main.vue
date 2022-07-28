<script setup lang='ts'>
import questradeUrl from '@/assets/questrade1.csv?url'
import { useTradeStore } from '@store/trade'
import { onMounted, ref } from 'vue'
import EventTimeline from '@comp/EventTimeline.vue'
import Button from '@comp/core/Button.vue'
import Modal from '@comp/core/Modal.vue'
import * as u from './util'

let tradeStore = useTradeStore()

function importExample() {
  tradeStore.importCsvFile(questradeUrl)
}

let showClearModal = ref(false)

</script>
<template>
  <div class="flex flex-col">
    <Teleport to="body">
      <Modal title="Confirm Clear Data"
             okLabel="Clear"
             okStyle="err"
             @ok="useTradeStore().clear()"
             :show="showClearModal"
             @hide="showClearModal = false">
        <p>This will delete all trade data from the app.</p>
        <p>This action cannot be reversed.</p>
      </Modal>
    </Teleport>

    <div class="flex flex-row">
      <div class="flex-1 flex flex-row">
        <Button type="pri"
                @click="importExample">
          Import Example
        </Button>
      </div>
      <Button type="err"
              class="self-end"
              @click="showClearModal = true">
        Clear Data
      </Button>
    </div>

    <div id="tradeAccordion"
         class="accordion flex flex-col">
      <div v-for="([year, hists], i) of tradeStore.tradeHistory"
           :key="year"
           class="accordion-item bg-white border border-gray-200">
        <h2 :id="'heading' + i"
            class="accordion-header mb-0">
          <button class="accordion-button relative flex items-center w-full py-4 px-5 text-base text-gray-800 text-left bg-white border-0 rounded-none transition focus:outline-none"
                  type="button"
                  data-bs-toggle="collapse"
                  :data-bs-target="'#collapse' + i"
                  aria-expanded="false"
                  aria-controls="collapseOne5">
            <div class="flex flex-col">
              <div class="text-xl">{{ year }}</div>
              <div class="">Capital Gains: {{ hists.yearGains.format() }} </div>
              <div class="">Trades: {{ u.fmtNum(hists.tradeCount) }}</div>
            </div>
          </button>
        </h2>
        <div :id="'collapse' + i"
             class="accordion-collapse collapse"
             :class="{ show: i == 0 }"
             :aria-labelledby="'collapse' + i">

          <div v-for="([security, events], j) of hists.tickerTrades"
               :key="security"
               class="accordion-item bg-white border border-gray-200">
            <h2 :id="`heading-${i}-${j}`"
                class="accordion-header mb-0">
              <button class="accordion-button relative flex items-center w-full py-4 px-5 text-base text-gray-800 text-left bg-white border-0 rounded-none transition focus:outline-none"
                      type="button"
                      data-bs-toggle="collapse"
                      :data-bs-target="`#collapse-${i}-${j}`"
                      aria-expanded="false"
                      aria-controls="collapseOne5">
                <div class="flex flex-col pl-2.5">
                  <div class="text-xl">{{ security }}</div>
                  <div class="">Capital Gains: {{ events.yearGains.format() }} </div>
                  <div class="">Trades: {{ u.fmtNum(events.tradeCount) }}</div>
                </div>
              </button>
            </h2>
            <div :id="`collapse-${i}-${j}`"
                 class="accordion-collapse collapse"
                 :class="{ show: j == 0 }"
                 :aria-labelledby="`collapse-${i}-${j}`">

              <div class="accordion-body py-4 px-5">
                <EventTimeline :events="events" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
</style>
