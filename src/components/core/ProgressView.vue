<script setup lang='ts'>
import * as v from 'vue'

// Animated progress bar
// https://stackoverflow.com/a/58163874

let props = defineProps<{
  progress: number
  hint?: string
}>()

</script>
<template>
  <div class="progress-bar-striped">
    <div class="bg-green-500"
         :style="`width: ${progress}%;`">
      <p class="ml-4 font-bold">{{ props.hint }}</p>
    </div>
  </div>

</template>
<style scoped>
.progress-bar-striped {
  overflow: hidden;
  height: 20px;
  margin-bottom: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
  -webkit-box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  -moz-box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-bar-striped>div {
  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
  background-size: 40px 40px;
  float: left;
  width: 0%;
  height: 100%;
  font-size: 12px;
  line-height: 20px;
  color: #ffffff;
  text-align: left;
  -webkit-box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  -moz-box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  -webkit-transition: width 1s ease;
  -moz-transition: width 1s ease;
  -o-transition: width 1s ease;
  transition: width 1s ease;
  animation: progress-bar-stripes 2s linear infinite;
}

@keyframes progress-bar-stripes {
  0% {
    background-position: 40px 0;
  }

  100% {
    background-position: 0 0;
  }
}
</style>
