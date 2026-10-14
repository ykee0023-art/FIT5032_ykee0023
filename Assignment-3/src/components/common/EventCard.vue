<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRatingStore } from '@/stores/ratingStore'
import StarRating from '@/components/common/StarRating.vue'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  // Level that fits the page outline: 2 under the page's h1, 3 under a section's h2
  headingLevel: {
    type: Number,
    default: 2,
  },
})

const authStore = useAuthStore()
const ratingStore = useRatingStore()
// Read from the store, because ratings arrive from Firestore after the card is created
const userRating = computed(() =>
  authStore.isAuthenticated
    ? ratingStore.getUserRating(props.event.id, authStore.currentUser.id)
    : 0,
)

const avgRating = computed(
  () => ratingStore.getAverageRating(props.event.id) || props.event.rating,
)
const ratingCount = computed(() => ratingStore.getRatingCount(props.event.id))

const isFull = computed(() => props.event.spots === 0)

const formattedDate = computed(() => {
  return new Date(props.event.date).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})

function handleRate(newRating) {
  if (!authStore.isAuthenticated) return
  ratingStore.submitRating(props.event.id, authStore.currentUser.id, newRating)
}
</script>

<template>
  <div class="card h-100 shadow-sm">
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <span class="badge bg-success-subtle text-success">
          {{ event.type }}
        </span>
        <div class="text-end">
          <StarRating :model-value="avgRating" readonly size="sm" />
          <span class="small text-muted ms-1">{{ avgRating }} ({{ ratingCount }})</span>
        </div>
      </div>

      <component :is="`h${headingLevel}`" class="h5 card-title">{{ event.name }}</component>

      <p class="card-text text-muted small mb-2">
        <i class="bi bi-calendar me-1" aria-hidden="true"></i>
        <span class="visually-hidden">Date:</span> {{ formattedDate }}<br />
        <i class="bi bi-clock me-1" aria-hidden="true"></i>
        <span class="visually-hidden">Time:</span> {{ event.time }}<br />
        <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>
        <span class="visually-hidden">Location:</span> {{ event.suburb }}
      </p>

      <p class="card-text flex-grow-1">{{ event.description }}</p>

      <div class="border-top pt-2 mt-2">
        <template v-if="authStore.isAuthenticated">
          <small class="text-muted d-block mb-1">
            {{ userRating ? 'Your rating:' : 'Rate this event:' }}
          </small>
          <StarRating :model-value="userRating" @update:model-value="handleRate" size="md" />
          <p
            v-if="ratingStore.saveError?.eventId === event.id"
            class="small text-danger mb-0 mt-1"
            role="alert"
          >
            {{ ratingStore.saveError.message }}
          </p>
        </template>
        <template v-else>
          <small class="text-muted">
            <RouterLink to="/login">Sign in</RouterLink> to rate
          </small>
        </template>
      </div>

      <div class="mt-auto pt-2">
        <div class="d-flex justify-content-between align-items-center">
          <span :class="isFull ? 'text-danger' : 'text-success'" class="small fw-bold">
            {{ isFull ? 'Full' : `${event.spots} spots left` }}
          </span>
          <RouterLink
            class="btn btn-sm"
            :class="isFull ? 'btn-outline-secondary' : 'btn-greenroots'"
            :to="{ path: '/get-involved', query: { event: event.id } }"
            :aria-label="`${isFull ? 'Join waitlist for' : 'Register for'} ${event.name}`"
          >
            {{ isFull ? 'Join waitlist' : 'Register' }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
