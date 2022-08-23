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
import Accordion from '@c/core/Accordion.vue'
import { DateTime } from 'luxon'


let tradeStore = useTradeStore()

function importExample() {
  tradeStore.importCsvFile(questradeUrl)
}

let showImportModal = v.ref(false)
let showClearModal = v.ref(false)
let showEditModal = v.ref(false)
let editModalTickerField = v.ref('')
let editModalDateField = v.ref(DateTime.now())

let ui = v.computed(() => ({
  tradeHistory: tradeStore.tradeHistory.filter(it => it[0] != 0),
  orphanTrades: tradeStore.tradeHistory.filter(it => it[0] == 0),
}))

function onShowEditModal(ticker: string, date: DateTime) {
  editModalTickerField.value = ticker
  editModalDateField.value = date
  showEditModal.value = true
}

</script>
<template>
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
                    :date="editModalDateField"
                    :show="showEditModal"
                    @hide="showEditModal = false" />
  </Teleport>

  <div v-bind="$attrs"
       class="flex-col items-center mt-4">
    <div class="w-[90%]">
      <div class="w-full flex">
        <div class="flex-1 flex">
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
           class="accordion w-full mt-4">
        <Accordion v-for="([__, hists], i) of ui.orphanTrades"
                   id="orphan">
          <template #header>
            <div class="flex-col flex-1">
              <div class="text-xl">Ungrouped Trades</div>
              <div class="">Trades: {{ u.fmt(hists.tradeCount) }}</div>
            </div>
          </template>

          <template #body>
            <Accordion v-for="([security, events], j) of hists.tickerTrades"
                       :id="`orphan-${i}-${j}`"
                       :key="security">
              <template #header>
                <div class="flex-col flex-1 pl-2.5">
                  <div class="text-xl">{{ security }}</div>
                  <div class="">Capital Gains: {{ events.yearGains.format() }} </div>
                  <div class="">Trades: {{ u.fmt(events.tradeCount) }}</div>
                </div>
              </template>

              <template #body>
                <div class="accordion-body py-4 px-5">
                  <EventTimeline :events="events" />
                </div>
              </template>
            </Accordion>
          </template>
        </Accordion>

        <Accordion v-for="([year, hists], i) of ui.tradeHistory"
                   :id="`` + i"
                   :key="year">
          <template #header>
            <div class="flex-col flex-1">
              <div class="text-xl">{{ year }}</div>
              <div class="">Capital Gains: {{ hists.yearGains.format() }} </div>
              <div class="">Trades: {{ u.fmt(hists.tradeCount) }}</div>
            </div>
          </template>

          <template #body>
            <Accordion v-for="([security, events], j) of hists.tickerTrades"
                       :id="`${i}-${j}`"
                       :key="security">
              <template #header>
                <div class="flex-col flex-1 pl-2.5">
                  <div class="text-xl">{{ security }}</div>
                  <div class="">Capital Gains: {{ events.yearGains.format() }} </div>
                  <div class="">Trades: {{ u.fmt(events.tradeCount) }}</div>
                </div>
                <!-- @click.stop does not work!? -->
                <!-- https://stackoverflow.com/a/70664716 -->
                <Icon class="w-6 h-6 ml-2 mr-1 fill-blue-600"
                      :path="mdiPlus"
                      @click="onShowEditModal(security, DateTime.local(year, 1, 1))"
                      data-bs-toggle="collapse"
                      data-bs-target />
              </template>

              <template #body>
                <div class="accordion-body py-4 px-5">
                  <EventTimeline :events="events" />
                </div>
              </template>
            </Accordion>
          </template>
        </Accordion>
      </div>
    </div>
  </div>
</template>
<style scoped>
</style>
