<script setup lang='ts'>
import DateInput from '@comp/core/DateInput.vue'
import FxInput from '@comp/core/FxInput.vue'
import Modal from '@comp/core/Modal.vue'
import NumberInput from '@comp/core/NumberInput.vue'
import SelectInput from '@comp/core/SelectInput.vue'
import TextInput from '@comp/core/TextInput.vue'
import * as u from '@comp/util'
import { useTradeStore } from '@store/trade'
import { Fx, OptionHistory, TradeEvent } from '@store/tradeEvent'
import money from 'currency.js'
import { DateTime } from 'luxon'
import * as v from 'vue'
import { ReportItem } from './type'
import InputFeedbackView from './core/InputFeedbackView.vue'

let props = defineProps<{
  show: boolean,
  trade: ReportItem,
}>()
let emits = defineEmits({
  hide: () => true,
})

let tradeStore = useTradeStore()

let securityRef = v.ref('')
let actionRef = v.ref('')
let tradeDateRef = v.ref(DateTime.now())
let settleDateRef = v.ref(DateTime.now())
let sharesRef = v.ref(0)
let priceRef = v.ref(0)
let outlayRef = v.ref(0)
let priceFxRef = v.ref<Fx>(u.CAD)
let outlayFxRef = v.ref<Fx>(u.CAD)

let assetClassRef = v.ref('')
let optionTypeRef = v.ref('')
let expiryDateRef = v.ref(DateTime.now())
let strikeRef = v.ref(0)
let strikeFxRef = v.ref<Fx>(u.CAD)
let optionLotOptionsRef = v.ref(new Map<string, OptionHistory>())
let optionLotRef = v.ref('')

// Errs
let errs = {
  settleDate: v.ref(''),
  optionLot: v.ref(''),
  expiryDate: v.ref(''),
}

v.watch(securityRef, (security) => { // Show all option lots for ticker
  let optLot = props.trade.tradeEvent.optionLot
  // debugger
  optionLotOptionsRef.value.clear()
  optionLotRef.value = 'new'

  tradeStore.profile.tradeHistory.get(security)
    ?.option?.values()?.let(it => [...it])
    ?.flatMap(it => it)
    ?.forEach(it => {
      optionLotOptionsRef.value.set(it.id, it)
      if (it.id == optLot?.id) // Same lot as trade? Select that
        optionLotRef.value = it.id
    })
})

v.watch(optionLotRef, (optionLot) => { // Fill opt contract fields for lot
  let c = optionLotOptionsRef.value.get(optionLot)?.contract
  if (!c) return

  optionTypeRef.value = c.type
  expiryDateRef.value = c.expiryDate
  strikeRef.value = c.strike.value
  strikeFxRef.value = c.strikeFx
})

let optionLotOptionsUi = v.computed(() => {
  let r = new Map([['new', 'New lot']])
  optionLotOptionsRef.value.forEach(it => {
    let c = it.contract
    r.set(it.id, `$${c.strike} ${c.type} ${c.expiryDate.toFormat('yyyy-MM-dd')} - #${it.id.slice(-4)}`)
  })
  return r
})

let disableOkUi = v.computed(() => {
  for (let err of Object.values(errs))
    if (err.value) return true
})

init()
function init() {
  let trade = props.trade.tradeEvent
  securityRef.value = trade.security
  actionRef.value = trade.action
  tradeDateRef.value = trade.date
  settleDateRef.value = trade.settleDate
  sharesRef.value = trade.shares
  priceRef.value = trade.price.value
  outlayRef.value = trade.outlay.value
  priceFxRef.value = trade.priceFx
  outlayFxRef.value = trade.outlayFx

  if (trade.options) {
    let it = trade.options
    assetClassRef.value = 'option'
    optionTypeRef.value = it.type
    expiryDateRef.value = it.expiryDate
    strikeRef.value = it.strike.value
    strikeFxRef.value = it.strikeFx
  } else {
    assetClassRef.value = 'stock'
    optionTypeRef.value = 'call'
    expiryDateRef.value = DateTime.now()
    strikeRef.value = 0
    strikeFxRef.value = u.CAD
  }
  optionLotRef.value = trade.optionLot?.id ?? 'new'

  validateForm(new CustomEvent('init'))
}

async function onSave() {
  let newTrade = <TradeEvent>{
    id: props.trade.tradeEvent.id,
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

  if (assetClassRef.value == 'option') { // Option? Set option fields
    newTrade.optionLot = optionLotOptionsRef.value.get(optionLotRef.value)
    newTrade.options = newTrade.optionLot?.contract ?? {
      type: optionTypeRef.value,
      expiryDate: expiryDateRef.value,
      strike: money(strikeRef.value),
      strikeFx: strikeFxRef.value,
    }
  }

  await tradeStore.updateTrade(newTrade, props.trade)
}

async function onDelete() {
  await tradeStore.deleteTrade(props.trade.tradeEvent)
}

function validateForm(event: Event) {
  let assetClass = assetClassRef.value
  let action = actionRef.value
  let tradeDate = tradeDateRef.value
  let settleDate = settleDateRef.value
  let expiryDate = expiryDateRef.value
  let lotId = optionLotRef.value
  let tradeLot = props.trade.tradeEvent.optionLot

  errs.settleDate.value = ''
  if (settleDate < tradeDate)
    errs.settleDate.value = 'Settlement date should not be earlier than trade date.'

  errs.expiryDate.value = ''
  if (assetClass == 'option' && expiryDate < tradeDate)
    errs.expiryDate.value = 'Expiry date should not be earlier than trade date.'

  errs.optionLot.value = ''
  // Moving buy option event to another lot? Must be head of lot or create new lot
  if (assetClass == 'option' && action == 'buy'
    && lotId != 'new'
    && lotId != tradeLot?.id) {
    let lotHead = optionLotOptionsRef.value.get(lotId)!.trades[0].tradeEvent
    if (lotHead.action == 'buy')
      errs.optionLot.value = 'Option purchase event must be the first event in a lot. Cannot move to this lot as this lot already has an option purchase event as its first event.'
    else if (lotHead.date < tradeDate)
      errs.optionLot.value = `Option purchase event must be the first event in a lot. Cannot move to this lot as this lot's first event has a trade date of ${lotHead.date.toISODate()}, which is earlier than this event.`
  }

  // Moving sell option event to another lot? Must not be head of lot
  if (assetClass == 'option' && action == 'sell'
    && lotId != tradeLot?.id) {
    if (lotId == 'new')
      errs.optionLot.value = 'Option sale event must not be the first event in a lot. Please create an option purchase event first.'
    else {
      let lotHead = optionLotOptionsRef.value.get(lotId)!.trades[0].tradeEvent
      if (lotHead.date > tradeDate)
        errs.optionLot.value = `Option sale event must not be the first event in a lot. Cannot move to this lot as this lot's first event has a trade date of ${lotHead.date.toISODate()}, which is later than this event.`
    }
  }
}

function onUserChangeContract(event: Event) {
  if (event.isTrusted) optionLotRef.value = 'new'
  validateForm(event)
}

</script>
<template>
  <Modal title="Edit Trade"
         @ok="onSave"
         :okDisabled="disableOkUi"
         @cancel="init"
         @delete="onDelete"
         :show="show"
         @hide="emits('hide')">
    <form class="edit-trade-grid items-baseline gap-2
                 needs-validation"
          novalidate>
      <div class="">Asset Class</div>
      <SelectInput v-model="assetClassRef"
                   :options="new Map([
                     ['stock', 'Stock'],
                     ['option', 'Option']
                   ])" />

      <div class="">Security</div>
      <TextInput v-model="securityRef" />

      <div class="">Action</div>
      <SelectInput v-model="actionRef"
                   @update:modelValue="(_, ev) => validateForm(ev)"
                   :options="new Map([
                     ['buy', 'Buy'],
                     ['sell', 'Sell']
                   ])" />

      <div class="">Trade Date</div>
      <DateInput v-model="tradeDateRef"
                 @update:modelValue="(_, ev) => validateForm(ev)" />

      <div class="">Settlement Date</div>
      <InputFeedbackView :err="errs.settleDate.value">
        <DateInput v-model="settleDateRef"
                   @update:modelValue="(_, ev) => validateForm(ev)" />
      </InputFeedbackView>

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

      <template v-if="assetClassRef == 'option'">
        <div class="">Option Lot</div>
        <InputFeedbackView :err="errs.optionLot.value">
          <SelectInput v-model="optionLotRef"
                       @update:modelValue="(_, ev) => validateForm(ev)"
                       :options="optionLotOptionsUi" />
        </InputFeedbackView>

        <div class="">Option Type</div>
        <SelectInput v-model="optionTypeRef"
                     @update:modelValue="(_, ev) => onUserChangeContract(ev)"
                     :options="new Map([
                       ['call', 'Call'],
                       ['put', 'Put']
                     ])" />

        <div class="">Expiry Date</div>
        <InputFeedbackView :err="errs.expiryDate.value">
          <DateInput v-model="expiryDateRef"
                     @update:modelValue="(_, ev) => onUserChangeContract(ev)" />
        </InputFeedbackView>

        <div class="">Strike</div>
        <NumberInput v-model="strikeRef"
                     @update:modelValue="(_, ev) => onUserChangeContract(ev)" />

        <div class="">Strike Currency</div>
        <FxInput :date="tradeDateRef"
                 v-model="strikeFxRef"
                 @update:modelValue="(_, ev) => onUserChangeContract(ev)" />
      </template>
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
