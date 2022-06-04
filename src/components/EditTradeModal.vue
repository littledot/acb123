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

let props = defineProps<{
  trade: t.TradeEvent
}>()

let tradeActions = new Map([
  ['buy', 'Buy'],
  ['sell', 'Sell']
])

let securityRef = v.ref<string>()
let actionRef = v.ref<string>()
let tradeDateRef = v.ref<DateTime>()
let settleDateRef = v.ref<DateTime>()
let sharesRef = v.ref<number>()
let priceRef = v.ref<number>()
let outlayRef = v.ref<number>()
let priceFxRef = v.ref<t.Fx>()
let outlayFxRef = v.ref<t.Fx>()

v.watch(() => props.trade, (trade) => {
  if (!trade) return

  securityRef.value = trade.security
  actionRef.value = trade.action
  tradeDateRef.value = trade.date
  settleDateRef.value = trade.settleDate
  sharesRef.value = trade.shares
  priceRef.value = trade.price.value
  outlayRef.value = trade.outlay.value
  priceFxRef.value = trade.priceFx
  outlayFxRef.value = trade.outlayFx
})

</script>
<template>
  <div class="modal fade fixed top-0 left-0 hidden w-full h-full outline-none overflow-x-hidden overflow-y-auto"
       id="editTradeModal"
       data-bs-backdrop="static"
       data-bs-keyboard="false"
       tabindex="-1"
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
        <div
             class="modal-footer flex flex-shrink-0 flex-wrap items-center justify-end p-4 border-t border-gray-200 rounded-b-md">
          <button type="button"
                  class="inline-block px-6 py-2.5 bg-purple-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-purple-700 hover:shadow-lg focus:bg-purple-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-purple-800 active:shadow-lg transition duration-150 ease-in-out"
                  data-bs-dismiss="modal">Close</button>
          <button type="button"
                  class="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out ml-1">Understood</button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.edit-trade-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-auto-rows: auto;
  justify-items: end;
}
</style>
