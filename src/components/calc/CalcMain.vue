<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import Main from '@c/Main.vue'
import Nav from "@c/Nav.vue"
import { useFxStore } from '@m/stores/fx'
import { useTradeStore } from '@m/stores/trade'
import { onBeforeMount } from 'vue'

onBeforeMount(async () => {
  let tradeStore = useTradeStore()
  await tradeStore.init()
  let fxStore = useFxStore()
  await fxStore.init()
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
  