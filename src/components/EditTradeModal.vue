<script setup lang='ts'>
import { TradeNode } from '@/modules/tradeNode'
import DateInput from '@c/core/DateInput.vue'
import FxInput from '@c/core/FxInput.vue'
import InputFeedbackView from '@c/core/InputFeedbackView.vue'
import Modal from '@c/core/Modal.vue'
import NumberInput from '@c/core/NumberInput.vue'
import SelectInput from '@c/core/SelectInput.vue'
import TextInput from '@c/core/TextInput.vue'
import { useTradeStore } from '@m/stores/trade'
import { Fx, OptionLot, TradeEvent } from '@m/tradeEvent'
import * as u from '@m/util'
import money from 'currency.js'
import { DateTime } from 'luxon'
import { v4 } from 'uuid'
import * as v from 'vue'

let props = defineProps<{
  show: boolean,
  trade?: TradeNode,

  security?: string,
  date?: DateTime,
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
let notesRef = v.ref<string>()

let assetClassRef = v.ref('')
let optionTypeRef = v.ref('')
let expiryDateRef = v.ref(DateTime.now())
let strikeRef = v.ref(0)
let strikeFxRef = v.ref<Fx>(u.CAD)
let optionLotOptionsRef = v.ref(new Map<string, OptionLot>())
let optionLotRef = v.ref('')

// Errs
let errs = {
  security: v.ref(''),
  tradeDate: v.ref(''),
  settleDate: v.ref(''),
  shares: v.ref(''),
  price: v.ref(''),
  outlay: v.ref(''),
  strike: v.ref(''),
  priceFx: v.ref(''),
  outlayFx: v.ref(''),
  strikeFx: v.ref(''),
  optionLot: v.ref(''),
  expiryDate: v.ref(''),
}

let dateFields = {
  trade: { date: tradeDateRef, err: errs.tradeDate },
  settle: { date: settleDateRef, err: errs.settleDate },
  expiry: { date: expiryDateRef, err: errs.expiryDate },
}

v.watch(() => props.show, init)

v.watch(securityRef, (security) => { // Show all option lots for ticker
  let optLot = props.trade?.tradeEvent.optionLot
  // debugger
  optionLotOptionsRef.value.clear()
  optionLotRef.value = 'orphan'

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
  let r = new Map<string, u.SelectOption>([
    ['orphan', { label: 'Select a lot', disabled: true, hidden: true }],
    ['new', 'Create new lot'],
  ])

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

let stopValidateForm: v.WatchStopHandle | undefined

function init(show: boolean) {
  if (!show) {
    stopValidateForm?.()
    return
  }

  console.log('init called')
  assetClassRef.value = 'stock'
  securityRef.value = ''
  actionRef.value = 'buy'
  tradeDateRef.value = DateTime.now()
  settleDateRef.value = DateTime.now()
  sharesRef.value = 0
  priceRef.value = 0
  outlayRef.value = 0
  priceFxRef.value = u.CAD
  outlayFxRef.value = u.CAD
  notesRef.value = `Created on ${u.fmt(DateTime.now())}.`

  optionLotRef.value = 'new'
  optionTypeRef.value = 'call'
  expiryDateRef.value = DateTime.now()
  strikeRef.value = 0
  strikeFxRef.value = u.CAD

  props.trade?.tradeEvent?.let(it => {
    securityRef.value = it.security
    actionRef.value = it.action
    tradeDateRef.value = it.date
    settleDateRef.value = it.settleDate
    sharesRef.value = it.shares
    priceRef.value = it.price.value
    outlayRef.value = it.outlay.value
    priceFxRef.value = it.priceFx
    outlayFxRef.value = it.outlayFx
    notesRef.value = it.notes

    it.optionLot?.let(it => {
      optionLotRef.value = it.id

      it.contract.let(it => {
        assetClassRef.value = 'option'
        optionTypeRef.value = it.type
        expiryDateRef.value = it.expiryDate
        strikeRef.value = it.strike.value
        strikeFxRef.value = it.strikeFx
      })
    })
  })

  props.security?.let(it => securityRef.value = it)
  props.date?.let(it => {
    tradeDateRef.value = it
    settleDateRef.value = it
    expiryDateRef.value = it
  })

  stopValidateForm = v.watchEffect(() => validateForm())
}

async function onSave() {
  let newTrade = {
    id: props.trade?.tradeEvent.id ?? v4(),
    security: securityRef.value,
    action: actionRef.value,
    date: tradeDateRef.value,
    settleDate: settleDateRef.value,
    shares: sharesRef.value,
    price: money(priceRef.value),
    outlay: money(outlayRef.value),
    priceFx: priceFxRef.value,
    outlayFx: outlayFxRef.value,
    notes: notesRef.value,
  } as TradeEvent

  if (assetClassRef.value == 'option') { // Option? Set option fields
    newTrade.optionLot = optionLotOptionsRef.value.get(optionLotRef.value) ?? {
      id: 'new',
      contract: {
        type: optionTypeRef.value,
        expiryDate: expiryDateRef.value,
        strike: money(strikeRef.value),
        strikeFx: strikeFxRef.value,
      },
      trades: [],
    }
  }

  await tradeStore.updateTrade(newTrade, props.trade)
}

async function onDelete() {
  if (props.trade)
    await tradeStore.deleteTrade(props.trade.tradeEvent)
}

function validateForm() {
  console.log('validate form')
  let assetClass = assetClassRef.value
  let security = securityRef.value
  let action = actionRef.value
  let tradeDate = tradeDateRef.value
  let settleDate = settleDateRef.value
  let expiryDate = expiryDateRef.value
  let shares = sharesRef.value
  let price = priceRef.value
  let outlay = outlayRef.value
  let strike = strikeRef.value
  let priceFx = priceFxRef.value
  let outlayFx = outlayFxRef.value
  let strikeFx = strikeFxRef.value
  let lotId = optionLotRef.value
  let tradeLot = props.trade?.tradeEvent.optionLot

  for (let err of Object.values(errs))
    err.value = ''

  if (!security)
    errs.security.value = 'This field cannot be empty.'

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
  else if (Number.isNaN(shares))
    errs.shares.value = 'Please enter a valid number.'

  if (price < 0)
    errs.price.value = 'This value cannot be negative.'
  else if (Number.isNaN(price))
    errs.price.value = 'Please enter a valid number.'

  if (outlay < 0)
    errs.outlay.value = 'This value cannot be negative.'
  else if (Number.isNaN(outlay))
    errs.outlay.value = 'Please enter a valid number.'

  if (assetClass == 'option')
    if (strike < 0)
      errs.strike.value = 'This value cannot be negative.'
    else if (Number.isNaN(strike))
      errs.strike.value = 'Please enter a valid number.'

  // Validate fx input
  if (Number.isNaN(priceFx.rate))
    errs.priceFx.value = 'Please enter a valid number.'
  else if (priceFx.rate <= 0 && priceFx.currency == 'custom')
    errs.priceFx.value = 'This value must be a positive.'

  if (Number.isNaN(outlayFx.rate))
    errs.outlayFx.value = 'Please enter a valid number.'
  else if (outlayFx.rate <= 0 && outlayFx.currency == 'custom')
    errs.outlayFx.value = 'This value must be a positive.'

  if (Number.isNaN(strikeFx.rate))
    errs.strikeFx.value = 'Please enter a valid number.'
  else if (strikeFx.rate <= 0 && strikeFx.currency == 'custom')
    errs.strikeFx.value = 'This value must be a positive.'

  // Validate lotId
  if (lotId == 'orphan') {
    errs.optionLot.value = 'This trade is currently ungrouped. Please move it to a valid lot.'
  } else {
    // Moving buy option event to another lot? Must be head of lot or create new lot
    if (assetClass == 'option' && action == 'buy'
      && lotId != 'new'
      && lotId != tradeLot?.id) {
      let lotHead = optionLotOptionsRef.value.get(lotId)!.trades[0].tradeEvent
      if (lotHead.action == 'buy')
        errs.optionLot.value = 'Option purchase event must be the first event in a lot. Cannot move to this lot as this lot already has an option purchase event as its first event.'
      else if (lotHead.date < tradeDate)
        errs.optionLot.value = `Option purchase event must be the first event in a lot. Cannot move to this lot as this lot's first event has a trade date of ${u.fmt(lotHead.date)}, which is earlier than this event.`
    }

    // Moving sell option event to another lot? Must not be head of lot
    if (assetClass == 'option' && action == 'sell'
      && lotId != tradeLot?.id) {
      if (lotId == 'new')
        errs.optionLot.value = 'Option sale event must not be the first event in a lot. Please create an option purchase event first.'
      else {
        let lotHead = optionLotOptionsRef.value.get(lotId)!.trades[0].tradeEvent
        if (lotHead.date > tradeDate)
          errs.optionLot.value = `Option sale event must not be the first event in a lot. Cannot move to this lot as this lot's first event has a trade date of ${u.fmt(lotHead.date)} which is later than this event.`
      }
    }
  }
  console.log('validate form ok')
}

function onUserChangeContract(event: Event) {
  if (event.isTrusted) optionLotRef.value = 'new'
}

function onNewDate(it: DateTime, dateField: u.DateField) {
  dateField.err.value = it.invalidExplanation ?? ''
  if (it.isValid)
    dateField.date.value = it
}

</script>
<template>
  <Modal :title="trade ? 'Edit Trade' : 'New Trade'"
         @ok="onSave"
         :okDisabled="disableOkUi"
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
      <InputFeedbackView class="w-full"
                         :err="errs.security.value">
        <TextInput v-model="securityRef" />
      </InputFeedbackView>

      <div class="">Action</div>
      <SelectInput v-model="actionRef"
                   :options="new Map([
                     ['buy', 'Buy'],
                     ['sell', 'Sell'],
                     ['exercise', 'Exercise']
                   ])" />

      <div class="">Trade Date</div>
      <InputFeedbackView class="w-full"
                         :err="errs.tradeDate.value">
        <DateInput :modelValue="tradeDateRef"
                   @update:modelValue="it => onNewDate(it, dateFields.trade)" />
      </InputFeedbackView>

      <div class="">Settlement Date</div>
      <InputFeedbackView class="w-full"
                         :err="errs.settleDate.value">
        <DateInput :modelValue="settleDateRef"
                   @update:modelValue="it => onNewDate(it, dateFields.settle)" />
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
      <InputFeedbackView class="w-full"
                         :err="errs.priceFx.value">
        <FxInput :date="tradeDateRef"
                 v-model="priceFxRef" />
      </InputFeedbackView>

      <div class="">Outlay</div>
      <InputFeedbackView class="w-full"
                         :err="errs.outlay.value">
        <NumberInput v-model="outlayRef" />
      </InputFeedbackView>

      <div class="">Outlay Currency</div>
      <InputFeedbackView class="w-full"
                         :err="errs.outlayFx.value">
        <FxInput :date="tradeDateRef"
                 v-model="outlayFxRef" />
      </InputFeedbackView>

      <div class="">Notes</div>
      <TextInput v-model="notesRef" />

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
          <DateInput :modelValue="expiryDateRef"
                     @update:modelValue="(it, ev) => {
                       onUserChangeContract(ev)
                       onNewDate(it, dateFields.expiry)
                     }" />
        </InputFeedbackView>

        <div class="">Strike</div>
        <InputFeedbackView class="w-full"
                           :err="errs.strike.value">
          <NumberInput v-model="strikeRef"
                       @update:modelValue="(_, ev) => onUserChangeContract(ev)" />
        </InputFeedbackView>

        <div class="">Strike Currency</div>
        <InputFeedbackView class="w-full"
                           :err="errs.strikeFx.value">
          <FxInput :date="tradeDateRef"
                   v-model="strikeFxRef"
                   @update:modelValue="(_, ev) => onUserChangeContract(ev)" />
        </InputFeedbackView>
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
