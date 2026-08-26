<script setup>
import { onMounted } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import EventCard from '@/components/common/EventCard.vue'

const store = useEventStore()

onMounted(() => {
  store.loadEvents()
})
</script>

<template>
  <div class="container py-5">
    <h1 class="mb-2">Community Greening Events</h1>
    <p class="text-muted mb-4">
      {{ store.totalEvents }} events across Greater Melbourne &middot; Average rating:
      {{ store.averageRating }} / 5
    </p>

    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6">
        <label for="event-search" class="visually-hidden">Search events by name or suburb</label>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
          <input
            id="event-search"
            v-model="store.searchQuery"
            type="search"
            class="form-control"
            placeholder="Search events by name or suburb..."
          />
        </div>
      </div>
      <div class="col-12 col-md-4">
        <label for="event-type" class="visually-hidden">Filter events by type</label>
        <select id="event-type" v-model="store.selectedType" class="form-select">
          <option value="">All types</option>
          <option v-for="type in store.eventTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
      <div class="col-12 col-md-2">
        <button class="btn btn-outline-secondary w-100" @click="store.clearFilters()">Clear</button>
      </div>
    </div>

    <p class="text-muted small" role="status" aria-live="polite">
      Showing {{ store.filteredEvents.length }} of {{ store.totalEvents }} events
    </p>

    <div class="row g-4">
      <div
        v-for="event in store.filteredEvents"
        :key="event.id"
        class="col-12 col-sm-6 col-lg-4"
      >
        <EventCard :event="event" />
      </div>
    </div>

    <div v-if="store.filteredEvents.length === 0" class="text-center py-5">
      <i class="bi bi-search display-4 text-muted"></i>
      <p class="text-muted fs-5 mt-3">No events found matching your search.</p>
      <button class="btn btn-greenroots" @click="store.clearFilters()">View all events</button>
    </div>
  </div>
</template>
