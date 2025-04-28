import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/DashboardView.vue')
  },
  {
    path: '/analysis',
    component: () => import('../views/AnalysisView.vue')
  },
  {
    path: '/history',
    component: () => import('../views/HistoryView.vue')
  },
  {
    path: '/profile',
    component: () => import('../views/ProfileView.vue')
  },
  {
    path: '/login',
    component: () => import('../views/LoginView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Setup navigation guards
router.beforeEach((to, from, next) => {
  // Check if the user is authenticated
  const isAuthenticated = !!localStorage.getItem('token')
  
  // If the route requires authentication and the user is not authenticated
  if (to.path !== '/login' && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router