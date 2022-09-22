import { createRouter, createWebHashHistory } from 'vue-router'


export default createRouter({
  history: createWebHashHistory(),
  linkActiveClass: 'active',
  routes: [
    {
      path: '/', name: 'home',
      component: () => import('@c/landing/LandingMain.vue')
    },
    {
      path: '/calc', name: 'calc',
      component: () => import('@c/calc/CalcMain.vue')
    },
    {
      path: '/privacy', name: 'privacy',
      component: () => import('@c/privacy/PrivacyMain.vue')
    },
  ],
})

export const homeLink = { name: 'home' }
export const calcLink = { name: 'calc' }
export const privLink = { name: 'privacy' }
