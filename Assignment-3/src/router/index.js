import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { title: 'About Us' },
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventsView.vue'),
      meta: { title: 'Events' },
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
      meta: { title: 'Find a Planting Site' },
    },
    {
      path: '/impact',
      name: 'impact',
      component: () => import('../views/ImpactView.vue'),
      meta: { title: 'Our Impact' },
    },
    {
      path: '/developers',
      name: 'developers',
      component: () => import('../views/DevelopersView.vue'),
      meta: { title: 'Developer API' },
    },
    {
      path: '/resources',
      name: 'resources',
      component: () => import('../views/ResourcesView.vue'),
      meta: { title: 'Resources' },
    },
    {
      path: '/get-involved',
      name: 'get-involved',
      component: () => import('../views/GetInvolvedView.vue'),
      meta: { title: 'Get Involved', requiresAuth: true },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/ContactView.vue'),
      meta: { title: 'Contact Us' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: 'Sign In' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { title: 'My Dashboard', requiresAuth: true },
    },
    {
      path: '/compose',
      name: 'compose',
      component: () => import('../views/ComposeEmailView.vue'),
      meta: { title: 'Send an Email', requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { title: 'Admin Dashboard', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/registrations',
      name: 'admin-registrations',
      component: () => import('../views/RegistrationsView.vue'),
      meta: { title: 'Volunteer Registrations', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/access-denied',
      name: 'access-denied',
      component: () => import('../views/AccessDeniedView.vue'),
      meta: { title: 'Access Denied' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Page Not Found' },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  // Wait for Firebase to restore the session, otherwise a refresh on /admin is sent to /login
  await authStore.initAuth()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'access-denied' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

// Each page gets its own tab title, so screen reader and tab users know where they are (WCAG 2.4.2)
router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} | GreenRoots Melbourne`
    : 'GreenRoots Melbourne | Community Urban Greening'
})

export default router
