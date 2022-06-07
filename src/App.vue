<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import Main from '@/components/Main.vue'
import Nav from "@/components/Nav.vue"
import { useTradeStore } from '@store/trade'
import { onBeforeMount } from 'vue'

onBeforeMount(async () => {
  let tradeStore = useTradeStore()
  await tradeStore.init()
})


</script>

<template>
  <Nav />
  <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
  <Main />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
