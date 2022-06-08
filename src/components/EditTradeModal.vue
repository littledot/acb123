<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from './symbol'
import * as u from './util'
import TextInput from './core/TextInput.vue'
import DateInput from './core/DateInput.vue'
import SelectInput from './core/SelectInput.vue'
import NumberInput from './core/NumberInput.vue'
import FxInput from './core/FxInput.vue'
import { DateTime } from 'luxon'
import money from 'currency.js'
import { useTradeStore } from '@store/trade'
import { TradeEvent } from '@store/tradeEvent'

let props = defineProps<{
  show: boolean,
  trade: TradeEvent,
}>()
let emits = defineEmits({
  close: () => true,
})

let tradeStore = useTradeStore()

let tradeActions = new Map([
  ['buy', 'Buy'],
  ['sell', 'Sell']
])

let trade = props.trade
let securityRef = v.ref<string>()
let actionRef = v.ref<string>()
let tradeDateRef = v.ref<DateTime>()
let settleDateRef = v.ref<DateTime>()
let sharesRef = v.ref<number>()
let priceRef = v.ref<number>(0)
let outlayRef = v.ref<number>(0)
let priceFxRef = v.ref<t.Fx>()
let outlayFxRef = v.ref<t.Fx>()
init()

function init() {
  securityRef.value = trade.security
  actionRef.value = trade.action
  tradeDateRef.value = trade.date
  settleDateRef.value = trade.settleDate
  sharesRef.value = trade.shares
  priceRef.value = trade.price.value
  outlayRef.value = trade.outlay.value
  priceFxRef.value = trade.priceFx
  outlayFxRef.value = trade.outlayFx
}

async function onSave() {
  let newTrade = <TradeEvent>{
    id: trade.id,
    security: securityRef.value,
    action: actionRef.value,
    date: tradeDateRef.value,
    settleDate: settleDateRef.value,
    shares: sharesRef.value,
    price: money(priceRef.value),
    outlay: money(outlayRef.value),
    priceFx: priceFxRef.value,
    outlayFx: outlayFxRef.value,
  }

  await tradeStore.updateTrade(newTrade)
  emits('close')
}

async function onDelete() {
  await tradeStore.deleteTrade(trade)
  emits('close')
}

function onCancel() {
  init()
  emits('close')
}

function onClickBg(event: Event) {
  if (event.target.id === 'modalRoot') onCancel()
}

</script>
<template>
  <Transition>
    <div v-if="show"
         class="modal fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-black/50"
         id="modalRoot"
         tabindex="-1"
         @click="onClickBg"
         @keyup.enter="onSave"
         @keyup.esc="onCancel"
         aria-labelledby="staticBackdropLabel"
         aria-hidden="true">
      <div class="modal-dialog relative w-auto pointer-events-none">
        <div
             class="modal-content border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-white bg-clip-padding rounded-md outline-none text-current">
          <div
               class="modal-header flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
            <h5 class="text-xl font-medium leading-normal text-gray-800"
                id="exampleModalLabel">
              Edit Trade
            </h5>
            <button type="button"
                    class="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline"
                    data-bs-dismiss="modal"
                    @click="onCancel"
                    aria-label="Close"></button>
          </div>
          <div class="modal-body relative p-4">
            <form class="edit-trade-grid items-baseline gap-2
                        needs-validation"
                  novalidate>
              <div class="">Security</div>
              <TextInput v-model="securityRef" />

              <div class="">Action</div>
              <SelectInput :options="tradeActions"
                           v-model="actionRef" />

              <div class="">Trade Date</div>
              <DateInput v-model="tradeDateRef" />

              <div class="">Settlement Date</div>
              <DateInput v-model="settleDateRef" />

              <div class="">Shares</div>
              <NumberInput v-model="sharesRef" />

              <div class="">Price</div>
              <NumberInput v-model="priceRef" />
              <div class="">Price Currency</div>
              <FxInput :date="tradeDateRef"
                       v-model="priceFxRef" />

              <div class="">Outlay</div>
              <NumberInput v-model="outlayRef" />
              <div class="">Outlay Currency</div>
              <FxInput :date="tradeDateRef"
                       v-model="outlayFxRef" />
            </form>
          </div>
          <div class="modal-footer flex flex-shrink-0 flex-wrap items-center p-4 border-t border-gray-200 rounded-b-md">
            <div class="flex-1">
              <button type="button"
                      class="inline-block px-6 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out"
                      @click="onDelete"
                      data-bs-dismiss="modal">
                Delete
              </button>
            </div>
            <div class="flex flex-row">
              <button type="button"
                      class="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
                      @click="onCancel"
                      data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="button"
                      class="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out ml-1"
                      @click="onSave">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
<style scoped>
.edit-trade-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-auto-rows: auto;
  justify-items: end;
}
</style>
