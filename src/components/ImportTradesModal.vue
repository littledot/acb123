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
