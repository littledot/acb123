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
  tradeDate: v.ref(''),
  settleDate: v.ref(''),
  shares: v.ref(''),
  price: v.ref(''),
  outlay: v.ref(''),
  strike: v.ref(''),
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

v.watchEffect(() => validateForm())

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

function validateForm() {
  console.log('validate form')
  let assetClass = assetClassRef.value
  let action = actionRef.value
  let tradeDate = tradeDateRef.value
  let settleDate = settleDateRef.value
  let expiryDate = expiryDateRef.value
  let shares = sharesRef.value
  let price = priceRef.value
  let outlay = outlayRef.value
  let strike = strikeRef.value
  let lotId = optionLotRef.value
  let tradeLot = props.trade.tradeEvent.optionLot

  for (let err of Object.values(errs))
    err.value = ''

  // Validate trade date
  if (!tradeDate.isValid)
    errs.tradeDate.value = tradeDate.invalidExplanation ?? ''
  else if (tradeDate > DateTime.now())
    errs.tradeDate.value = 'You made a trade in the future? Can I borrow your time machine?'

  // Validate settlement date
  if (!settleDate.isValid)
    errs.settleDate.value = settleDate.invalidExplanation ?? ''
  else if (settleDate < tradeDate)
    errs.settleDate.value = 'Settlement date cannot be earlier than trade date.'

  // Validate options expiry date
  if (!expiryDate.isValid)
    errs.expiryDate.value = expiryDate.invalidExplanation ?? ''
  else if (expiryDate < tradeDate && assetClass == 'option')
    errs.expiryDate.value = 'Expiry date cannot be earlier than trade date.'

  // Validate number values
  if (shares < 0)
    errs.shares.value = 'This value cannot be negative.'

  if (price < 0)
    errs.price.value = 'This value cannot be negative.'

  if (outlay < 0)
    errs.outlay.value = 'This value cannot be negative.'

  if (strike < 0 && assetClass == 'option')
    errs.strike.value = 'This value cannot be negative.'

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
  console.log('validate form ok')
}

function onUserChangeContract(event: Event) {
  if (event.isTrusted) optionLotRef.value = 'new'
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
                   :options="new Map([
                     ['buy', 'Buy'],
                     ['sell', 'Sell']
                   ])" />

      <div class="">Trade Date</div>
      <InputFeedbackView class="w-full"
                         :err="errs.tradeDate.value">
        <DateInput v-model="tradeDateRef" />
      </InputFeedbackView>

      <div class="">Settlement Date</div>
      <InputFeedbackView class="w-full"
                         :err="errs.settleDate.value">
        <DateInput v-model="settleDateRef" />
      </InputFeedbackView>

      <div class="">Shares</div>
      <InputFeedbackView class="w-full"
                         :err="errs.shares.value">
        <NumberInput v-model="sharesRef" />
      </InputFeedbackView>

      <div class="">Price</div>
      <InputFeedbackView class="w-full"
                         :err="errs.price.value">
        <NumberInput v-model="priceRef" />
      </InputFeedbackView>
      <div class="">Price Currency</div>
      <FxInput :date="tradeDateRef"
               v-model="priceFxRef" />

      <div class="">Outlay</div>
      <InputFeedbackView class="w-full"
                         :err="errs.outlay.value">
        <NumberInput v-model="outlayRef" />
      </InputFeedbackView>
      <div class="">Outlay Currency</div>
      <FxInput :date="tradeDateRef"
               v-model="outlayFxRef" />

      <template v-if="assetClassRef == 'option'">
        <div class="">Option Lot</div>
        <InputFeedbackView class="w-full"
                           :err="errs.optionLot.value">
          <SelectInput v-model="optionLotRef"
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
        <InputFeedbackView class="w-full"
                           :err="errs.expiryDate.value">
          <DateInput v-model="expiryDateRef"
                     @update:modelValue="(_, ev) => onUserChangeContract(ev)" />
        </InputFeedbackView>

        <div class="">Strike</div>
        <InputFeedbackView class="w-full"
                           :err="errs.strike.value">
          <NumberInput v-model="strikeRef"
                       @update:modelValue="(_, ev) => onUserChangeContract(ev)" />
        </InputFeedbackView>

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
