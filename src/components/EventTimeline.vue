<script setup lang='ts'>
import { ref, computed, inject, onMounted, onRenderTriggered } from 'vue'
import * as v from 'vue'
import * as t from './type'
import * as s from './symbol'
import * as u from './util'
import TradeEvent from './TradeEvent.vue'

let props = defineProps<{
  events: t.ReportItem[]
}>()
let emits = defineEmits({})

</script>

<template>
  <ol>
    <li v-for="(it, i) of events"
        :key="it.tradeEvent.id">
      <TradeEvent :event="it"
                  :isFirst="i === 0"
                  :isLast="i === events.length - 1" />
    </li>
    <!-- <li>
      <div class="flex flex-start items-center">
        <div class="bg-blue-600 w-4 h-4 flex items-center justify-center rounded-full -ml-2 mr-3 -mt-2"></div>
        <h4 class="text-gray-800 font-semibold text-xl -mt-2">Title of section 2</h4>
      </div>
      <div class="ml-6 mb-6 pb-6">
        <a href="#!"
          class="text-blue-600 hover:text-blue-700 focus:text-blue-800 duration-300 transition ease-in-out text-sm">12
          January, 2022</a>
        <p class="text-gray-700 mt-2 mb-4">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
          doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto
          beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit,
          sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
        <button type="button"
          class="inline-block px-4 py-1.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Read
          more</button>
      </div>
    </li>
    <li>
      <div class="flex flex-start items-center">
        <div class="bg-blue-600 w-4 h-4 flex items-center justify-center rounded-full -ml-2 mr-3 -mt-2"></div>
        <h4 class="text-gray-800 font-semibold text-xl -mt-2">Title of section 3</h4>
      </div>
      <div class="ml-6 mb-6 pb-6">
        <a href="#!"
          class="text-blue-600 hover:text-blue-700 focus:text-blue-800 duration-300 transition ease-in-out text-sm">27
          December, 2021</a>
        <p class="text-gray-700 mt-2 mb-4">At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
          praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati
          cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et
          dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.</p>
        <button type="button"
          class="inline-block px-4 py-1.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Read
          more</button>
      </div>
    </li> -->
  </ol>
</template>
<style scoped>
.timeline-grid {
  display: grid;
  grid-template-columns: [price-l] min-content [price-r cost-l] min-content [cost-r shares-l] min-content [shares-r acb-l] min-content [acb-r cg-l] min-content [cg-r];
  grid-auto-rows: auto;
}
</style>
