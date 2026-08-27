<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const currentPath = computed(() => route.path)
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
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/get-involved' }" to="/get-involved">Get Involved</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :class="{ active: currentPath === '/contact' }" to="/contact">Contact Us</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
