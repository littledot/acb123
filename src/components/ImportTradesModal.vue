<script setup lang='ts'>
import Modal from '@comp/core/Modal.vue'
import SelectInput from '@comp/core/SelectInput.vue'
import * as u from '@comp/util'
import { QtParser, TradeConfirmParser } from '@store/parser'
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
  fileFormatRef.value = 'custom'
  parserRef.value.clear()
}

v.watch(fileRef, (file) => {
  file?.let(
    it => Papa.parse(it, {
      preview: 5,
      skipEmptyLines: true,
      transform: (s) => s.trim().toLocaleLowerCase(),
      complete: (results: ParseResult<string[]>) => {



        let qtParser = new QtParser(results)
        parserRef.value.set('qt', qtParser)
        if (qtParser.missing.size == 0) {
          fileFormatRef.value = 'qt'
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
    fileErr: parser.papaErr.at(0)?.let(it => 'Could not parse file. Are you sure this is a CSV file?'),
    fileFmtErr: parser.papaErr ? null : parser.missing,
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
        <div v-if="ui.fileErr">{{ ui.fileErr }}</div>
      </div>
      <div class="">File Format</div>
      <div class="flex flex-col w-full">
        <SelectInput :options="u.importFmts"
                     v-model="fileFormatRef" />
        <div v-if="ui.fileFmtErr">{{ ui.fileFmtErr }}</div>
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
