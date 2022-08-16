<script setup lang='ts'>
import Button from '@c/core/Button.vue'

let props = defineProps<{
  id: string,
  show?: boolean,
}>()

</script>
<template>
  <div class="accordion-item bg-white border border-gray-200">
    <h2 :id="`header-${id}`"
        class="accordion-header mb-0">
      <button class="accordion-button relative flex items-center w-full py-4 px-5 text-base text-gray-800 text-left bg-white border-0 rounded-none transition focus:outline-none"
              type="button"
              data-bs-toggle="collapse"
              :data-bs-target="`#collapse-${id}`"
              aria-expanded="false"
              aria-controls="collapseOne5">
        <slot name="header" />
      </button>
    </h2>
    <div :id="`collapse-${id}`"
         class="accordion-collapse collapse"
         :class="{ show: show }"
         :aria-labelledby="`collapse-${id}`">
      <slot name="body" />
    </div>
  </div>
</template>
<style scoped>
</style>
