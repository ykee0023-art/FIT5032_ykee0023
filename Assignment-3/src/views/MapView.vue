<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEventStore } from '@/stores/eventStore'

const MELBOURNE = [144.9631, -37.8136]
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const store = useEventStore()
const route = useRoute()
const router = useRouter()

const mapContainer = ref(null)
const mapReady = ref(false)
const mapError = ref('')
const selectedId = ref(null)

// Mapbox objects are kept out of Vue's reactivity, which would wrap them in proxies
let map = null
let activePopup = null
const markersById = new Map()

const mapEvents = computed(() =>
  store.events.filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng)),
)

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function spotsLabel(event) {
  return event.spots > 0 ? `${event.spots} of ${event.totalSpots} spots left` : 'Fully booked'
}

function registerLocation(event) {
  return { path: '/get-involved', query: { event: event.id } }
}

function element(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

// Built with DOM nodes and textContent rather than setHTML, so event text is never parsed as HTML
function buildPopup(event) {
  const root = element('div', 'map-popup')
  root.append(
    element('h2', 'h6 mb-1', event.name),
    element('p', 'small text-muted mb-1', `${formatDate(event.date)} · ${event.time}`),
    element('p', 'small mb-1', `${event.location}, ${event.suburb}`),
    element('p', `small fw-semibold mb-2 ${event.spots > 0 ? 'text-success' : 'text-danger'}`, spotsLabel(event)),
  )

  const register = element(
    'button',
    `btn btn-sm ${event.spots > 0 ? 'btn-greenroots' : 'btn-outline-secondary'}`,
    event.spots > 0 ? 'Register' : 'Join waitlist',
  )
  register.type = 'button'
  register.addEventListener('click', () => router.push(registerLocation(event)))

  const actions = element('div', 'd-flex flex-wrap gap-2')
  actions.append(register)
  root.append(actions)
  return root
}

function addMarkers() {
  for (const marker of markersById.values()) marker.remove()
  markersById.clear()

  for (const event of mapEvents.value) {
    const popup = new mapboxgl.Popup({ offset: 32, maxWidth: '280px' }).setDOMContent(
      buildPopup(event),
    )
    popup.on('open', () => {
      if (activePopup && activePopup !== popup) activePopup.remove()
      activePopup = popup
      selectedId.value = event.id
    })

    const marker = new mapboxgl.Marker({ color: event.spots > 0 ? '#2e7d32' : '#6c757d' })
      .setLngLat([event.lng, event.lat])
      .setPopup(popup)
      .addTo(map)
    // Mapbox makes markers with a popup focusable and opens the popup on Enter
    marker.getElement().setAttribute('role', 'button')
    marker.getElement().setAttribute('aria-label', `${event.name}, ${event.suburb}`)
    markersById.set(event.id, marker)
  }
}

function fitToEvents() {
  if (!map || mapEvents.value.length === 0) return
  const bounds = new mapboxgl.LngLatBounds()
  for (const event of mapEvents.value) bounds.extend([event.lng, event.lat])
  map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 })
}

function showOnMap(event, { keepFocus = true } = {}) {
  selectedId.value = event.id
  router.replace({ query: { ...route.query, event: event.id } })
  if (!map) return

  const trigger = document.activeElement
  map.flyTo({ center: [event.lng, event.lat], zoom: Math.max(map.getZoom(), 13) })
  const marker = markersById.get(event.id)
  if (marker && !marker.getPopup().isOpen()) marker.togglePopup()
  // The popup moves focus into itself; list users stay on the list, which offers the same actions
  if (keepFocus && trigger instanceof HTMLElement) trigger.focus({ preventScroll: true })
}

function initMap() {
  if (!MAPBOX_TOKEN) {
    mapError.value = 'The map is not available right now. The list shows every event location.'
    return
  }
  try {
    mapboxgl.accessToken = MAPBOX_TOKEN
    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: MELBOURNE,
      zoom: 10,
      // Otherwise labels and the scale bar follow the browser language
      language: 'en',
    })
  } catch {
    // Thrown when the browser has no WebGL support
    mapError.value =
      'Your browser cannot display the map. The list shows every event location instead.'
    return
  }

  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left')
  map.on('load', () => {
    mapReady.value = true
  })
  map.on('error', () => {
    // Errors after loading are usually a single missing tile, which Mapbox retries on its own
    if (!mapReady.value) {
      mapError.value = 'The map could not be loaded. The list shows every event location instead.'
    }
  })
}

watch([mapReady, mapEvents], ([ready, events]) => {
  if (!ready || events.length === 0) return
  addMarkers()
  const requested = events.find((event) => String(event.id) === String(route.query.event))
  if (requested) showOnMap(requested, { keepFocus: false })
  else fitToEvents()
})

onMounted(() => {
  store.loadEvents()
  initMap()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markersById.clear()
})
</script>

<template>
  <div class="container py-5">
    <h1 class="mb-2">Find a Planting Site Near You</h1>
    <p class="text-muted mb-4">
      Every GreenRoots event is shown on the map and in the list. Select an event to see its
      details and register.
    </p>

    <div v-if="store.loadError" class="alert alert-danger" role="alert">
      {{ store.loadError }}
    </div>

    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <div v-if="mapError" class="alert alert-warning" role="alert">
          <i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>{{ mapError }}
        </div>
        <div
          v-show="!mapError"
          ref="mapContainer"
          class="map-canvas rounded shadow-sm"
          aria-describedby="map-help"
        ></div>
        <p v-if="!mapError" id="map-help" class="form-text mb-0">
          Use the arrow keys to move the map and + or − to zoom. The event list has the same
          information.
        </p>
      </div>

      <div class="col-12 col-lg-4">
        <section class="event-list-panel" aria-labelledby="event-list-heading">
          <h2 id="event-list-heading" class="h5 mb-2">Events</h2>
          <p class="small text-muted mb-2" aria-live="polite">
            <template v-if="store.loading">Loading events...</template>
            <template v-else>{{ mapEvents.length }} events, soonest first.</template>
          </p>

          <ul class="list-group event-list">
            <li
              v-for="event in mapEvents"
              :key="event.id"
              class="list-group-item"
              :class="{ 'event-list-item--selected': selectedId === event.id }"
            >
              <button
                type="button"
                class="btn btn-link p-0 text-start fw-semibold text-decoration-none event-list-name"
                :aria-current="selectedId === event.id ? 'true' : undefined"
                @click="showOnMap(event)"
              >
                {{ event.name }}<span class="visually-hidden">, show on map</span>
              </button>
              <div class="small text-muted">
                {{ formatDate(event.date) }} · {{ event.location }}, {{ event.suburb }}
              </div>
              <div
                class="small fw-semibold"
                :class="event.spots > 0 ? 'text-success' : 'text-danger'"
              >
                {{ spotsLabel(event) }}
              </div>
              <div v-if="selectedId === event.id" class="d-flex flex-wrap gap-2 mt-2">
                <RouterLink
                  class="btn btn-sm"
                  :class="event.spots > 0 ? 'btn-greenroots' : 'btn-outline-secondary'"
                  :to="registerLocation(event)"
                  :aria-label="`${event.spots > 0 ? 'Register for' : 'Join waitlist for'} ${event.name}`"
                >
                  {{ event.spots > 0 ? 'Register' : 'Join waitlist' }}
                </RouterLink>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-canvas {
  height: min(70vh, 640px);
  min-height: 360px;
}

.event-list-item--selected {
  background-color: var(--gr-cream);
  border-left: 4px solid var(--gr-green);
}

.event-list-name {
  color: var(--gr-green-dark);
}

@media (min-width: 992px) {
  .event-list {
    max-height: min(62vh, 560px);
    overflow-y: auto;
  }
}

:deep(.mapboxgl-popup-content) {
  font-family: var(--bs-body-font-family);
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
}

/* The default close button is about 15px, too small to tap reliably */
:deep(.mapboxgl-popup-close-button) {
  width: 32px;
  height: 32px;
  font-size: 1.25rem;
}

:deep(.map-popup h2) {
  color: var(--gr-green-dark);
  padding-right: 1.5rem;
}
</style>
