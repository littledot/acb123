<script setup lang='ts'>
import questradeUrl from '@/assets/questrade1.csv?url'
import Button from '@c/core/Button.vue'
import Modal from '@c/core/Modal.vue'
import EventTimeline from '@c/EventTimeline.vue'
import ImportTradesModal from '@c/ImportTradesModal.vue'
import { mdiPlus } from '@mdi/js'
import { useTradeStore } from '@m/stores/trade'
import * as v from 'vue'
import Icon from '@c/core/Icon.vue'
import * as u from '@m/util'
import EditTradeModal from '@c/EditTradeModal.vue'

let tradeStore = useTradeStore()

function importExample() {
  tradeStore.importCsvFile(questradeUrl)
}

let showImportModal = v.ref(false)
let showClearModal = v.ref(false)
let showEditModal = v.ref(false)
let editModalTickerField = v.ref('')

function onShowEditModal(ticker: string) {
  editModalTickerField.value = ticker
  showEditModal.value = true
}

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

    <Teleport to="body">
      <ImportTradesModal title="Import Trades"
                         okLabel="Import"
                         okStyle="ok"
                         @ok=""
                         :show="showImportModal"
                         @hide="showImportModal = false" />
    </Teleport>

    <Teleport to="body">
      <EditTradeModal :security="editModalTickerField"
                      :show="showEditModal"
                      @hide="showEditModal = false" />
    </Teleport>

    <div class="flex flex-row">
      <div class="flex-1 flex flex-row">
        <Button type="pri"
                @click="importExample">
          Import Example
        </Button>
        <Button type="pri"
                @click="showImportModal = true">
          Import Trades (CSV)
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
            <div class="flex flex-col flex-1">
              <div class="text-xl">{{ year }}</div>
              <div class="">Capital Gains: {{ hists.yearGains.format() }} </div>
              <div class="">Trades: {{ u.fmt(hists.tradeCount) }}</div>
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
                <div class="flex flex-col flex-1 pl-2.5">
                  <div class="text-xl">{{ security }}</div>
                  <div class="">Capital Gains: {{ events.yearGains.format() }} </div>
                  <div class="">Trades: {{ u.fmt(events.tradeCount) }}</div>
                </div>
                <!-- @click.stop does not work!? -->
                <!-- https://stackoverflow.com/a/70664716 -->
                <Icon class="w-6 h-6 ml-2 mr-1 fill-blue-600"
                      :path="mdiPlus"
                      @click="onShowEditModal(security)"
                      data-bs-toggle="collapse"
                      data-bs-target />
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
