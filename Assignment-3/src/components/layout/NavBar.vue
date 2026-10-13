<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentPath = computed(() => route.path)

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-greenroots sticky-top shadow-sm">
    <div class="container">
      <RouterLink class="navbar-brand" to="/">
        <i class="bi bi-tree me-2" aria-hidden="true"></i>GreenRoots Melbourne
      </RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/' }" to="/">Home</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/about' }" to="/about">About Us</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/events' }" to="/events">Events</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/resources' }" to="/resources">Resources</RouterLink>
          </li>
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/get-involved' }" to="/get-involved">Get Involved</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/contact' }" to="/contact">Contact Us</RouterLink>
          </li>
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/dashboard' }" to="/dashboard">Dashboard</RouterLink>
          </li>
          <li v-if="authStore.isAdmin" class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/admin' }" to="/admin">
              <i class="bi bi-shield-lock me-1"></i>Admin
            </RouterLink>
          </li>

          <li v-if="!authStore.isAuthenticated" class="nav-item ms-lg-2">
            <RouterLink class="btn btn-outline-light btn-sm" to="/login">
              <i class="bi bi-box-arrow-in-right me-1"></i>Sign In
            </RouterLink>
          </li>

          <li v-else class="nav-item dropdown ms-lg-2">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle me-1"></i>
              {{ authStore.userName }}
              <span
                class="badge ms-1"
                :class="authStore.isAdmin ? 'bg-danger' : 'bg-info'"
              >
                {{ authStore.userRole }}
              </span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <RouterLink class="dropdown-item" to="/dashboard">
                  <i class="bi bi-speedometer2 me-2"></i>My Dashboard
                </RouterLink>
              </li>
              <li v-if="authStore.isAdmin">
                <RouterLink class="dropdown-item" to="/admin">
                  <i class="bi bi-shield-lock me-2"></i>Admin Panel
                </RouterLink>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a
                  class="dropdown-item text-danger"
                  href="#"
                  @click.prevent="handleLogout"
                >
                  <i class="bi bi-box-arrow-right me-2"></i>Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
