import { createRouter, createWebHistory } from 'vue-router'


export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/', name: 'home',
      component: () => import('@c/landing/LandingMain.vue')
    },
    {
      path: '/calc', name: 'calc',
      component: () => import('@c/calc/CalcMain.vue')
    },
  ],
})

export const homeLink = { name: 'home' }
export const calcLink = { name: 'calc' }
