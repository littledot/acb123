<script setup lang='ts'>
import Button from '@comp/core/Button.vue'

let props = defineProps<{
  show: boolean,
  showDelete?: boolean,

  title: string,
  okLabel?: string,
  cancelLabel?: string,
  deleteLabel?: string,
}>()
let emits = defineEmits({
  hide: () => true,
  ok: () => true,
  cancel: () => true,
  delete: () => true,
})

async function onOk() {
  emits('ok')
  emits('hide')
}

function onCancel() {
  emits('cancel')
  emits('hide')
}

async function onDelete() {
  emits('delete')
  emits('hide')
}

function onClickBg(event: Event) {
  if (event.target?.id === 'modalRoot') onCancel()
}
</script>
<template>
  <Transition>
    <div v-if="show"
         class="modal fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-black/50"
         id="modalRoot"
         tabindex="-1"
         @click="onClickBg"
         @keyup.enter="onOk"
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
              {{ title }}
            </h5>
            <button type="button"
                    class="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline"
                    @click="onCancel"
                    aria-label="Close" />
          </div>
          <div class="modal-body relative p-4">
            <slot />
          </div>
          <div class="modal-footer flex flex-shrink-0 flex-wrap items-center p-4 border-t border-gray-200 rounded-b-md">
            <div class="flex-1">
              <Button v-if="showDelete"
                      type="err"
                      @click="onDelete">
                {{ deleteLabel ?? 'Delete' }}
              </Button>
            </div>
            <div class="flex flex-row">
              <Button type="pri"
                      @click="onCancel">
                {{ cancelLabel ?? 'Cancel' }}
              </Button>
              <Button class="ml-1"
                      type="ok"
                      @click="onOk">
                {{ okLabel ?? 'OK' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
<style scoped>
</style>
