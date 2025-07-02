import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/exam',
      name: 'exam',
      component: HomeView,
      props: (route) => ({ 
        examMode: true,
        examParams: route.query
      })
    },
  ]
})

export default router
