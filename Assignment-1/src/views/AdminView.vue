<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useEventStore } from '@/stores/eventStore'

const authStore = useAuthStore()
const eventStore = useEventStore()
const users = ref([])

onMounted(() => {
  users.value = authStore.getAllUsers()
  eventStore.loadEvents()
})

const volunteerCount = computed(() =>
  users.value.filter((u) => u.role === 'volunteer').length,
)
const adminCount = computed(() =>
  users.value.filter((u) => u.role === 'admin').length,
)
</script>

<template>
  <div class="container py-5">
    <div class="d-flex align-items-center mb-4">
      <h1 class="me-3">Admin Dashboard</h1>
      <span class="badge bg-danger fs-6">ADMIN ONLY</span>
    </div>

    <div class="row g-4 mb-5">
      <div class="col-6 col-md-3">
        <div class="card text-center shadow-sm">
          <div class="card-body">
            <i class="bi bi-people display-6 text-greenroots"></i>
            <h3 class="mt-2 mb-0">{{ users.length }}</h3>
            <p class="text-muted mb-0">Total Users</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center shadow-sm">
          <div class="card-body">
            <i class="bi bi-person-heart display-6 text-success"></i>
            <h3 class="mt-2 mb-0">{{ volunteerCount }}</h3>
            <p class="text-muted mb-0">Volunteers</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center shadow-sm">
          <div class="card-body">
            <i class="bi bi-shield-lock display-6 text-danger"></i>
            <h3 class="mt-2 mb-0">{{ adminCount }}</h3>
            <p class="text-muted mb-0">Admins</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center shadow-sm">
          <div class="card-body">
            <i class="bi bi-calendar-event display-6 text-primary"></i>
            <h3 class="mt-2 mb-0">{{ eventStore.totalEvents }}</h3>
            <p class="text-muted mb-0">Total Events</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-people me-2"></i>Registered Users</h5>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span
                  class="badge"
                  :class="user.role === 'admin' ? 'bg-danger' : 'bg-success'"
                >
                  {{ user.role }}
                </span>
              </td>
              <td>
                {{ new Date(user.createdAt).toLocaleDateString('en-AU') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
