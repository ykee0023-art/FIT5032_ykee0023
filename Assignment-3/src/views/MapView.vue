<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEventStore } from '@/stores/eventStore'
import { useGeolocation } from '@/composables/useGeolocation'
import { circlePolygon, formatDistance, haversineKm } from '@/utils/geo'
import PlaceSearch from '@/components/map/PlaceSearch.vue'

const MELBOURNE = [144.9631, -37.8136]
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const RADIUS_OPTIONS = [5, 10, 20, 50]
const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] }

const store = useEventStore()
const route = useRoute()
const router = useRouter()
const { locating, error: locationError, locate } = useGeolocation()

const mapContainer = ref(null)
const placeSearch = ref(null)
const mapReady = ref(false)
const mapError = ref('')
const selectedId = ref(null)
// Starting point from place search or the browser location: { label, lat, lng }
const origin = ref(null)
const radiusKm = ref(0)

// Mapbox objects are kept out of Vue's reactivity, which would wrap them in proxies
let map = null
let activePopup = null
let originMarker = null
const markersById = new Map()

const mapEvents = computed(() =>
  store.events.filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng)),
)

// Events with their straight-line distance from the starting point, nearest first
const listEvents = computed(() => {
  if (!origin.value) return mapEvents.value.map((event) => ({ event, distanceKm: null }))
  return mapEvents.value
    .map((event) => ({ event, distanceKm: haversineKm(origin.value, event) }))
    .filter(({ distanceKm }) => !radiusKm.value || distanceKm <= radiusKm.value)
    .sort((a, b) => a.distanceKm - b.distanceKm)
})

const listSummary = computed(() => {
  if (store.loading) return 'Loading events...'
  const count = listEvents.value.length
  const events = `${count} ${count === 1 ? 'event' : 'events'}`
  if (!origin.value) return `${events}, soonest first.`
  if (radiusKm.value && count === 0) {
    return `No events within ${radiusKm.value} km of ${origin.value.label}. Try a larger distance.`
  }
  if (radiusKm.value) return `${events} within ${radiusKm.value} km of ${origin.value.label}, nearest first.`
  return `${events}, nearest to ${origin.value.label} first.`
})

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
  updateMarkerVisibility()
}

// Markers outside the chosen radius are hidden so the map matches the list
function updateMarkerVisibility() {
  const visible = new Set(listEvents.value.map(({ event }) => event.id))
  for (const [id, marker] of markersById) {
    const shown = visible.has(id)
    if (!shown && marker.getPopup().isOpen()) marker.togglePopup()
    marker.getElement().style.display = shown ? '' : 'none'
  }
}

function addSearchLayers() {
  map.addSource('search-radius', { type: 'geojson', data: EMPTY_GEOJSON })
  map.addLayer({
    id: 'search-radius-fill',
    type: 'fill',
    source: 'search-radius',
    paint: { 'fill-color': '#0d6efd', 'fill-opacity': 0.08 },
  })
  map.addLayer({
    id: 'search-radius-line',
    type: 'line',
    source: 'search-radius',
    paint: { 'line-color': '#0d6efd', 'line-width': 2, 'line-dasharray': [2, 2] },
  })
}

function showOrigin() {
  originMarker?.remove()
  originMarker = null
  if (!map || !mapReady.value) return

  const circle = origin.value && radiusKm.value ? circlePolygon(origin.value, radiusKm.value) : null
  map.getSource('search-radius')?.setData(circle ?? EMPTY_GEOJSON)
  if (!origin.value) return

  originMarker = new mapboxgl.Marker({ color: '#0d6efd' })
    .setLngLat([origin.value.lng, origin.value.lat])
    .addTo(map)
  originMarker.getElement().setAttribute('role', 'img')
  originMarker.getElement().setAttribute('aria-label', `Starting point: ${origin.value.label}`)

  // Frame the radius, or the starting point and the three nearest events
  const bounds = new mapboxgl.LngLatBounds()
  bounds.extend([origin.value.lng, origin.value.lat])
  if (circle) {
    for (const point of circle.geometry.coordinates[0]) bounds.extend(point)
  } else {
    for (const { event } of listEvents.value.slice(0, 3)) bounds.extend([event.lng, event.lat])
  }
  map.fitBounds(bounds, { padding: 60, maxZoom: 14 })
}

function setOrigin(place) {
  origin.value = place
  locationError.value = ''
}

async function useMyLocation() {
  const position = await locate()
  if (position) {
    placeSearch.value?.clear()
    setOrigin({ label: 'your location', ...position })
  }
}

function clearOrigin() {
  origin.value = null
  radiusKm.value = 0
  placeSearch.value?.clear()
  fitToEvents()
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
    addSearchLayers()
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
  if (origin.value) showOrigin()
  const requested = events.find((event) => String(event.id) === String(route.query.event))
  if (requested) showOnMap(requested, { keepFocus: false })
  else fitToEvents()
})

watch([origin, radiusKm], showOrigin)
watch(listEvents, updateMarkerVisibility)

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

    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-6">
            <PlaceSearch ref="placeSearch" @select="setOrigin" />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <button
              type="button"
              class="btn btn-outline-greenroots w-100"
              :disabled="locating"
              @click="useMyLocation"
            >
              <span
                v-if="locating"
                class="spinner-border spinner-border-sm me-1"
                aria-hidden="true"
              ></span>
              <i v-else class="bi bi-crosshair me-1" aria-hidden="true"></i>
              {{ locating ? 'Finding you...' : 'Use my location' }}
            </button>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <label for="search-radius" class="form-label fw-semibold">Distance</label>
            <select
              id="search-radius"
              v-model.number="radiusKm"
              class="form-select"
              :disabled="!origin"
              aria-describedby="search-radius-help"
            >
              <option :value="0">Any distance</option>
              <option v-for="km in RADIUS_OPTIONS" :key="km" :value="km">Within {{ km }} km</option>
            </select>
          </div>
        </div>
        <span id="search-radius-help" class="visually-hidden">
          Choose a starting point first. Distances are straight-line distances.
        </span>

        <div v-if="locationError" class="alert alert-warning mt-3 mb-0" role="alert">
          <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>{{ locationError }}
        </div>
        <p v-if="origin" class="small mt-3 mb-0">
          <i class="bi bi-geo-alt-fill text-primary me-1" aria-hidden="true"></i>
          Starting point: <strong>{{ origin.label }}</strong>
          <button type="button" class="btn btn-link btn-sm p-0 ms-2 align-baseline" @click="clearOrigin">
            Clear<span class="visually-hidden"> starting point</span>
          </button>
        </p>
      </div>
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
          <p class="small text-muted mb-2" aria-live="polite">{{ listSummary }}</p>

          <ul v-if="listEvents.length" class="list-group event-list">
            <li
              v-for="{ event, distanceKm } in listEvents"
              :key="event.id"
              class="list-group-item"
              :class="{ 'event-list-item--selected': selectedId === event.id }"
            >
              <div class="d-flex justify-content-between align-items-start gap-2">
                <button
                  type="button"
                  class="btn btn-link p-0 text-start fw-semibold text-decoration-none event-list-name"
                  :aria-current="selectedId === event.id ? 'true' : undefined"
                  @click="showOnMap(event)"
                >
                  {{ event.name }}<span class="visually-hidden">, show on map</span>
                </button>
                <span v-if="distanceKm !== null" class="badge text-bg-light border flex-shrink-0">
                  {{ formatDistance(distanceKm) }}<span class="visually-hidden"> away</span>
                </span>
              </div>
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
