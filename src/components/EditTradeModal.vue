<script setup lang='ts'>
import * as v from 'vue'
import * as t from '@comp/type'
import * as s from './symbol'
import * as u from './util'
import TextInput from './core/TextInput.vue'
import DateInput from './core/DateInput.vue'
import Button from './core/Button.vue'
import SelectInput from './core/SelectInput.vue'
import NumberInput from './core/NumberInput.vue'
import FxInput from './core/FxInput.vue'
import { DateTime } from 'luxon'
import money from 'currency.js'
import { useTradeStore } from '@store/trade'
import { TradeEvent } from '@store/tradeEvent'
import Modal from './core/Modal.vue'

let props = defineProps<{
  show: boolean,
  trade: TradeEvent,
}>()
let emits = defineEmits({
  hide: () => true,
})

let tradeStore = useTradeStore()

let tradeActions = new Map([
  ['buy', 'Buy'],
  ['sell', 'Sell']
])

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
  let trade = props.trade
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
    id: props.trade.id,
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
}

async function onDelete() {
  await tradeStore.deleteTrade(props.trade)
}

</script>
<template>
  <Modal title="Edit Trade"
         @ok="onSave"
         @cancel="init"
         @delete="onDelete"
         :show="show"
         @hide="emits('hide')">
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
  </Modal>
</template>
<style scoped>
.edit-trade-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-auto-rows: auto;
  justify-items: end;
}
</style>
