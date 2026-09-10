<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const activeTab = ref('profile')

const formattedDate = computed(() =>
  new Date(authStore.currentUser?.createdAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)
</script>

<template>
  <div class="container py-5">
    <h1>Welcome back, {{ authStore.userName }}</h1>
    <p class="text-muted">
      <span
        class="badge"
        :class="authStore.isAdmin ? 'bg-danger' : 'bg-success'"
      >
        {{ authStore.userRole }}
      </span>
      Member since {{ formattedDate }}
    </p>

    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'profile' }"
          href="#"
          @click.prevent="activeTab = 'profile'"
        >
          <i class="bi bi-person me-1"></i>My Profile
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'ratings' }"
          href="#"
          @click.prevent="activeTab = 'ratings'"
        >
          <i class="bi bi-star me-1"></i>My Ratings
        </a>
      </li>
    </ul>

    <div v-if="activeTab === 'profile'">
      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="card-title">Profile Information</h5>
          <div class="row g-3">
            <div class="col-sm-6">
              <label class="form-label text-muted">Full Name</label>
              <p class="fw-semibold">{{ authStore.currentUser?.name }}</p>
            </div>
            <div class="col-sm-6">
              <label class="form-label text-muted">Email</label>
              <p class="fw-semibold">{{ authStore.currentUser?.email }}</p>
            </div>
            <div class="col-sm-6">
              <label class="form-label text-muted">Role</label>
              <p>
                <span
                  class="badge"
                  :class="authStore.isAdmin ? 'bg-danger' : 'bg-success'"
                >
                  {{ authStore.currentUser?.role }}
                </span>
              </p>
            </div>
            <div class="col-sm-6">
              <label class="form-label text-muted">Member Since</label>
              <p class="fw-semibold">{{ formattedDate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'ratings'">
      <p class="text-muted text-center py-4">Your ratings will appear here.</p>
    </div>
  </div>
</template>
