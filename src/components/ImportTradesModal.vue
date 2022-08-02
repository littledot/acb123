<script setup lang='ts'>
import Modal from '@comp/core/Modal.vue'
import SelectInput from '@comp/core/SelectInput.vue'
import * as u from '@comp/util'
import { IbkrParser, QtParser, TradeConfirmParser } from '@store/parser'
import { useTradeStore } from '@store/trade'
import Papa, { ParseResult } from 'papaparse'
import * as v from 'vue'
import FileInput from './core/FileInput.vue'

let props = defineProps<{
  show: boolean,
}>()
let emits = defineEmits({
  hide: () => true,
})

let tradeStore = useTradeStore()
let fileRef = v.ref<File>()
let fileFormatRef = v.ref('')
let parserRef = v.ref(new Map<string, TradeConfirmParser>())
init()

function init() {
  fileRef.value = undefined
  fileFormatRef.value = 'ibkr'
  parserRef.value.clear()
}

v.watch(fileRef, (file) => {
  file?.let(
    it => Papa.parse(it, {
      preview: 5,
      skipEmptyLines: true,
      transform: (s) => s.trim().toLocaleLowerCase(),
      complete: (result: ParseResult<string[]>) => {
        parserRef.value = new Map([
          ['ibkr', new IbkrParser(result)],
          ['qt', new QtParser(result)],
        ])
        for (let [id, parser] of parserRef.value.entries()) {
          if (parser.missing.size == 0) {
            fileFormatRef.value = id
            break
          }
        }
      }
    })
  )
})

let ui = v.computed(() => {
  let fileFmt = fileFormatRef.value
  let parser = parserRef.value.get(fileFmt)
  if (!parser) return {
    disableOk: true
  }

  return {
    fileErr: parser.papaErr.at(0)?.let(it => `Could not parse file. Are you sure this is a CSV file? (${it.message})`),
    fileFmtErr: parser.papaErr.length > 0 ? null :
      parser.missing.size > 0 ? `The following columns are missing: ${[...parser.missing.values()].join(', ')}` : null,
  }
})

function onImport() {
  let file = fileRef.value
  let parser = parserRef.value.get(fileFormatRef.value)
  if (!file || !parser) return

  useTradeStore().importCsvFile(file, parser)
}

</script>
<template>
  <Modal title="Import Trades"
         @ok="onImport"
         :ok-disabled="ui.disableOk"
         @cancel="init"
         :show="show"
         @hide="emits('hide')">
    <div class="flex flex-col">
      <div class="import-trade-grid items-baseline gap-2">
        <div class="">File</div>
        <div class="flex flex-col w-full">
          <FileInput class=""
                     accept=".csv, .tsv"
                     v-model="fileRef" />
          <div v-if="ui.fileErr"
               class="text-sm text-red-500">{{ ui.fileErr }}</div>
        </div>
        <div class="">File Format</div>
        <div class="flex flex-col w-full">
          <SelectInput :options="u.importFmts"
                       v-model="fileFormatRef" />
          <div v-if="ui.fileFmtErr"
               class="text-sm text-red-500">{{ ui.fileFmtErr }}</div>
        </div>
      </div>

      <div id="accordionExample"
           class="accordion mt-4">
        <div class="accordion-item bg-white border border-gray-200">
          <h2 class="accordion-header mb-0"
              id="headingOne">
            <button class="accordion-button relative flex items-center w-full py-4 px-5 text-base text-gray-800 text-left bg-white border-0 rounded-none transition focus:outline-none"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseOne"
                    aria-expanded="true"
                    aria-controls="collapseOne">
              Import Guide
            </button>
          </h2>
          <div id="collapseOne"
               class="accordion-collapse collapse"
               aria-labelledby="headingOne"
               data-bs-parent="#accordionExample">

            <template v-if="fileFormatRef == 'ibkr'">
              <a href="https://i.imgur.com/blJ3odN.png"
                 target="_blank">
                <img src="https://i.imgur.com/blJ3odN.png"
                     alt=""
                     loading="lazy" />
              </a>
              <div class="accordion-body py-4 px-5 border-b">
                <li>Click on <b>Performance & Reports</b>.</li>
                <li>Click on <b>Flex Queries</b>.</li>
                <li>Click on the <b>plus sign (+)</b> beside <b>Trade Confirmation Flex Query</b>.</li>
              </div>

              <a href="https://i.imgur.com/SP5R6I5.png"
                 target="_blank">
                <img src="https://i.imgur.com/SP5R6I5.png"
                     alt=""
                     loading="lazy" />
              </a>
              <div class="accordion-body py-4 px-5 border-b">
                <li>Select <b>CSV</b> for <b>Delivery Configuration > Format</b>.</li>
                <li>Select <b>Yes</b> for <b>Delivery Configuration > Include section code and line descriptor</b>.</li>
                <li>Click on <b>Trade Confirmation</b> under <b>Sections</b></li>
              </div>

              <a href="https://i.imgur.com/6vL9vc3.png"
                 target="_blank">
                <img src="https://i.imgur.com/6vL9vc3.png"
                     alt=""
                     loading="lazy" />
              </a>
              <div class="accordion-body py-4 px-5 border-b">
                <li>Make sure only <b>Symbol Summary</b> is selected.</li>
                <li>Click on <b>Select All</b>.</li>
                <li>You may unselect <b>Account ID</b> & <b>Account Alias</b> if you do not feel comfortable including
                  it.
                  This data is not used anyways.</li>
                <li>Scroll to the bottom and click <b>Save</b>.</li>
                <li>You should now be at the Flex Query creation page. Scroll to the bottom and click <b>Continue</b>
                </li>
                <li>You should now be at the Flex Query confirmation page. Scroll to the bottom and click <b>Save</b>.
                </li>
              </div>

              <a href="https://i.imgur.com/rkURyYE.png"
                 target="_blank">
                <img src="https://i.imgur.com/rkURyYE.png"
                     alt=""
                     loading="lazy" />
              </a>
              <div class="accordion-body py-4 px-5 border-b">
                <li>You should now be at the Reports page. Click on <b>Run (arrow icon)</b> beside the Trade
                  Confirmation
                  Flex Query you just created.</li>
                <li>Change the <b>From & To dates</b> as you see fit.</li>
                <li>Click on <b>Run</b>. A CSV file should be downloaded.</li>
                <li>Upload the CSV file at the very top of this page.</li>
              </div>
            </template>

            <template v-if="fileFormatRef == 'qt'">
              <a href="https://i.imgur.com/HgnPrxH.png"
                 target="_blank">
                <img src="https://i.imgur.com/HgnPrxH.png"
                     alt=""
                     loading="lazy" />
              </a>
              <div class="accordion-body py-4 px-5 border-b">
                <li>Click on <b>Accounts</b>.</li>
              </div>

              <a href="https://i.imgur.com/ULGelLG.png"
                 target="_blank">
                <img src="https://i.imgur.com/ULGelLG.png"
                     alt=""
                     loading="lazy" />
              </a>
              <div class="accordion-body py-4 px-5 border-b">
                <li>Click on <b>Reports</b>.</li>
                <li>Click on <b>Trade confirmations</b>.</li>
              </div>

              <a href="https://i.imgur.com/GzfQ0j3.png"
                 target="_blank">
                <img src="https://i.imgur.com/GzfQ0j3.png"
                     alt=""
                     loading="lazy" />
              </a>
              <div class="accordion-body py-4 px-5 border-b">
                <li>Select the <b>Account #</b> to analyze.</li>
                <li>Change the <b>Start & End dates</b> as you see fit.</li>
                <li>Click on <b>View Report</b>.</li>
              </div>

              <a href="https://i.imgur.com/tnkwm5h.png"
                 target="_blank">
                <img src="https://i.imgur.com/tnkwm5h.png"
                     alt=""
                     loading="lazy" />
              </a>
              <div class="accordion-body py-4 px-5 border-b">
                <li>Click on <b>Export to CSV</b>. A CSV file should be downloaded.</li>
                <li>Upload the CSV file at the very top of this page.</li>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
<style scoped>
.import-trade-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-auto-rows: auto;
  justify-items: end;
}
</style>
