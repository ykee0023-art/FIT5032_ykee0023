<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import { useRatingStore } from '@/stores/ratingStore'
import EventCard from '@/components/common/EventCard.vue'
import EventsTable from '@/components/tables/EventsTable.vue'

const store = useEventStore()
const ratingStore = useRatingStore()
const route = useRoute()
const router = useRouter()

// Kept in the URL (?view=table) so the table view can be bookmarked and shared
const view = computed(() => (route.query.view === 'table' ? 'table' : 'cards'))

function setView(newView) {
  router.replace({ query: { ...route.query, view: newView === 'table' ? 'table' : undefined } })
}

onMounted(() => {
  store.loadEvents()
  ratingStore.loadRatings()
})
</script>

<template>
  <div class="container py-5">
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h1 class="mb-2">Community Greening Events</h1>
        <p class="text-muted mb-0">
          {{ store.totalEvents }} events across Greater Melbourne &middot; Average rating:
          {{ ratingStore.getOverallAverage() || store.averageRating }} / 5
        </p>
      </div>
      <div class="btn-group" role="group" aria-label="Choose how to display events">
        <button
          type="button"
          class="btn"
          :class="view === 'cards' ? 'btn-greenroots' : 'btn-outline-secondary'"
          :aria-pressed="view === 'cards'"
          @click="setView('cards')"
        >
          <i class="bi bi-grid-3x2-gap me-1" aria-hidden="true"></i>Cards
        </button>
        <button
          type="button"
          class="btn"
          :class="view === 'table' ? 'btn-greenroots' : 'btn-outline-secondary'"
          :aria-pressed="view === 'table'"
          @click="setView('table')"
        >
          <i class="bi bi-table me-1" aria-hidden="true"></i>Table
        </button>
      </div>
    </div>

    <div v-if="store.loadError" class="alert alert-danger" role="alert">
      {{ store.loadError }}
    </div>

    <EventsTable v-if="view === 'table'" :events="store.events" :loading="store.loading" />

    <template v-else>
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
          <button class="btn btn-outline-secondary w-100" @click="store.clearFilters()">
            Clear
          </button>
        </div>
      </div>

      <p class="text-muted small" role="status" aria-live="polite">
        <template v-if="store.loading">Loading events...</template>
        <template v-else>
          Showing {{ store.filteredEvents.length }} of {{ store.totalEvents }} events
        </template>
      </p>

      <div v-if="store.loading && store.events.length === 0" class="text-center py-5">
        <div class="spinner-border text-success" aria-hidden="true"></div>
      </div>

      <div class="row g-4">
        <div v-for="event in store.filteredEvents" :key="event.id" class="col-12 col-sm-6 col-lg-4">
          <EventCard :event="event" />
        </div>
      </div>

      <div
        v-if="!store.loading && !store.loadError && store.filteredEvents.length === 0"
        class="text-center py-5"
      >
        <i class="bi bi-search display-4 text-muted" aria-hidden="true"></i>
        <p class="text-muted fs-5 mt-3">No events found matching your search.</p>
        <button class="btn btn-greenroots" @click="store.clearFilters()">View all events</button>
      </div>
    </template>
  </div>
</template>
