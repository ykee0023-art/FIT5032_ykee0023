<script setup>
import { computed } from 'vue'

const props = defineProps({
  event: {
    type: Object,
    required: true
  }
})

const isFull = computed(() => props.event.spots === 0)

const formattedDate = computed(() => {
  return new Date(props.event.date).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
})
</script>

<template>
  <div class="card h-100 shadow-sm">
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <span class="badge bg-success-subtle text-success">
          {{ event.type }}
        </span>
        <span class="text-warning">
          <i class="bi bi-star-fill" aria-hidden="true"></i>
          <span class="visually-hidden">Rating:</span> {{ event.rating }}
          <span class="visually-hidden">out of 5</span>
        </span>
      </div>

      <h5 class="card-title">{{ event.name }}</h5>

      <p class="card-text text-muted small mb-2">
        <i class="bi bi-calendar me-1" aria-hidden="true"></i>
        <span class="visually-hidden">Date:</span> {{ formattedDate }}<br />
        <i class="bi bi-clock me-1" aria-hidden="true"></i>
        <span class="visually-hidden">Time:</span> {{ event.time }}<br />
        <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>
        <span class="visually-hidden">Location:</span> {{ event.suburb }}
      </p>

      <p class="card-text flex-grow-1">{{ event.description }}</p>

      <div class="mt-auto">
        <div class="d-flex justify-content-between align-items-center">
          <span :class="isFull ? 'text-danger' : 'text-success'" class="small fw-bold">
            {{ isFull ? 'Full' : `${event.spots} spots left` }}
          </span>
          <button
            class="btn btn-sm"
            :class="isFull ? 'btn-outline-secondary' : 'btn-greenroots'"
            :disabled="isFull"
            :aria-label="`${isFull ? 'Join waitlist for' : 'Register for'} ${event.name}`"
          >
            {{ isFull ? 'Waitlist' : 'Register' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
