<script setup lang="ts">
import { computed } from "vue";
import titles from "../post-data.json";


const props = defineProps<{
  query: string
}>()

const filteredTitles = computed(() => {
  return titles.filter((s) => {
    s.Name.toLocaleLowerCase().includes(props.query.toLocaleLowerCase())
  })
})

</script>

<template>
  <div class="root">
    <p>Showing {{filteredTitles.length}} results for "{{ query }}"</p>
    <ul>
      <li v-for="title in filteredTitles" :key="title.Page">{{ title.Name }}</li>
    </ul>
  </div>
</template>
