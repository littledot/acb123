<script setup lang='ts'>

let props = defineProps<{
  type: string,
}>()

const styles = {
  pri: 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg active:bg-blue-800 active:shadow-lg',
  sec: 'bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:shadow-lg focus:bg-purple-700 focus:shadow-lg active:bg-purple-800 active:shadow-lg',
  ok: 'bg-green-500 text-white shadow-md hover:bg-green-600 hover:shadow-lg focus:bg-green-600 focus:shadow-lg active:bg-green-700 active:shadow-lg',
  err: 'bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg active:bg-red-800 active:shadow-lg',
  warn: 'bg-yellow-500 text-white shadow-md hover:bg-yellow-600 hover:shadow-lg focus:bg-yellow-600 focus:shadow-lg active:bg-yellow-700 active:shadow-lg',
  info: 'bg-blue-400 text-white shadow-md hover:bg-blue-500 hover:shadow-lg focus:bg-blue-500 focus:shadow-lg active:bg-blue-600 active:shadow-lg',
  light: 'bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300 hover:shadow-lg focus:bg-gray-300 focus:shadow-lg active:bg-gray-400 active:shadow-lg',
  dark: 'bg-gray-800 text-white shadow-md hover:bg-gray-900 hover:shadow-lg focus:bg-gray-900 focus:shadow-lg active:bg-gray-900 active:shadow-lg',
  link: 'bg-transparent text-blue-600 hover:text-blue-700 hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200',
}

</script>
<template>
  <button type="button"
          class="inline-block px-6 py-2.5 font-medium text-xs leading-tight uppercase rounded focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
          :class="styles[type as keyof typeof styles]">
    <slot />
  </button>
</template>
<style scoped>
</style>
