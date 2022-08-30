<script setup lang='ts'>

let props = defineProps<{
  type: string,
}>()

const styles = {
  pri: 'bg-blue-600 text-white',
  sec: 'bg-purple-600 text-white',
  ok: 'bg-green-500 text-white',
  err: 'bg-red-600 text-white',
  warn: 'bg-yellow-500 text-white',
  info: 'bg-blue-400 text-white',
  light: 'bg-gray-200 text-gray-700',
  dark: 'bg-gray-800 text-white',
}

</script>
<template>
  <span class="text-xs inline-block py-1 px-2.5 ml-2 leading-none text-center whitespace-nowrap align-baseline font-bold rounded-full"
        :class="styles[type as keyof typeof styles]">
    <slot />
  </span>
</template>
<style scoped>
</style>
