<script setup lang='ts'>

let props = defineProps<{
  err: string,
}>()

</script>
<template>
  <div class="flex flex-col w-full">
    <slot />
    <div v-show="err"
         class="text-xs text-red-600">{{ err }}</div>
  </div>
</template>
<style scoped>
</style>
