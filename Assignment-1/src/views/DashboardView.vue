<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRatingStore } from '@/stores/ratingStore'
import { useEventStore } from '@/stores/eventStore'
import StarRating from '@/components/common/StarRating.vue'

const authStore = useAuthStore()
const ratingStore = useRatingStore()
const eventStore = useEventStore()
const activeTab = ref('profile')

onMounted(() => {
  ratingStore.loadRatings()
  eventStore.loadEvents()
})

const formattedDate = computed(() =>
  new Date(authStore.currentUser?.createdAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)

const myRatings = computed(() => {
  if (!authStore.currentUser) return []
  return ratingStore.getUserRatings(authStore.currentUser.id).map((r) => {
    const event = eventStore.events.find((e) => e.id === r.eventId)
    return {
      ...r,
      eventName: event?.name || 'Unknown Event',
      avgRating: ratingStore.getAverageRating(r.eventId),
      ratingCount: ratingStore.getRatingCount(r.eventId),
    }
  })
})

function updateRating(eventId, newRating) {
  ratingStore.submitRating(eventId, authStore.currentUser.id, newRating)
}
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
      <div v-if="myRatings.length === 0" class="text-center py-5">
        <i class="bi bi-star display-4 text-muted"></i>
        <p class="text-muted mt-3">You haven't rated any events yet.</p>
        <RouterLink to="/events" class="btn btn-greenroots">Browse Events</RouterLink>
      </div>

      <div v-else class="card shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Event</th>
                <th>Your Rating</th>
                <th>Average</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in myRatings" :key="item.eventId">
                <td>{{ item.eventName }}</td>
                <td>
                  <StarRating
                    :model-value="item.rating"
                    @update:model-value="(v) => updateRating(item.eventId, v)"
                    size="sm"
                  />
                </td>
                <td>{{ item.avgRating }} / 5</td>
                <td>{{ item.ratingCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
