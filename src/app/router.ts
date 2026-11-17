import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '@/common/constants/routes'
import HomePage from '@/pages/index.vue'
import MatchPage from '@/pages/m/[id].vue'
import NotFoundPage from '@/pages/[...404].vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: ROUTES.HOME, component: HomePage },
    { path: '/m/:id', name: ROUTES.MATCH, component: MatchPage },
    { path: '/:pathMatch(.*)*', component: NotFoundPage },
  ],
})
