<script setup>
import { computed, ref } from 'vue'
import { formatDistance, formatDuration } from '@/utils/geo'

// Average for new light vehicles sold in Australia (Green Vehicle Guide, 181 g/km).
// Older cars on the road emit more, so the saving shown is a conservative estimate.
const CAR_CO2_KG_PER_KM = 0.181
const MODES = [
  { id: 'walking', label: 'Walk', verb: 'Walking', icon: 'bi-person-walking' },
  { id: 'cycling', label: 'Cycle', verb: 'Cycling', icon: 'bi-bicycle' },
  { id: 'driving', label: 'Drive', verb: 'Driving', icon: 'bi-car-front' },
]

const props = defineProps({
  // { event, routes: { walking, cycling, driving } | null, loading, error }
  trip: { type: Object, required: true },
  origin: { type: Object, default: null },
})
const profile = defineModel('profile', { type: String, default: 'walking' })
const emit = defineEmits(['close', 'choose-start'])

const heading = ref(null)

const mode = computed(() => MODES.find((m) => m.id === profile.value))
const route = computed(() => props.trip.routes?.[profile.value] ?? null)
const drivingKm = computed(() => (props.trip.routes?.driving?.distance ?? 0) / 1000)

function formatKg(kg) {
  return kg < 0.1 ? 'less than 0.1 kg' : `about ${kg.toFixed(1)} kg`
}

const co2Message = computed(() => {
  if (!route.value || !drivingKm.value) return ''
  const carKg = drivingKm.value * CAR_CO2_KG_PER_KM
  if (profile.value === 'driving') {
    return `Driving this trip produces ${formatKg(carKg)} of CO₂. Walking or cycling would avoid it.`
  }
  return `${mode.value.verb} instead of driving saves ${formatKg(carKg)} of CO₂.`
})

defineExpose({ focus: () => heading.value?.focus() })
</script>

<template>
  <section class="card shadow-sm border-success mb-3" aria-labelledby="trip-heading">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
        <h2 id="trip-heading" ref="heading" class="h5 mb-0" tabindex="-1">
          Trip to {{ trip.event.name }}
        </h2>
        <button
          type="button"
          class="btn-close"
          aria-label="Close trip details"
          @click="emit('close')"
        ></button>
      </div>

      <template v-if="!origin">
        <p class="mb-2">
          Choose a starting point to see routes: search for a place or use your location.
        </p>
        <button
          type="button"
          class="btn btn-sm btn-outline-greenroots"
          @click="emit('choose-start')"
        >
          <i class="bi bi-search me-1" aria-hidden="true"></i>Search for a starting point
        </button>
      </template>

      <template v-else>
        <p class="small text-muted mb-2">From {{ origin.label }} to {{ trip.event.location }}</p>

        <div class="btn-group w-100 mb-3" role="group" aria-label="Travel mode">
          <button
            v-for="option in MODES"
            :key="option.id"
            type="button"
            class="btn btn-sm"
            :class="profile === option.id ? 'btn-greenroots' : 'btn-outline-secondary'"
            :aria-pressed="profile === option.id"
            :disabled="trip.loading"
            @click="profile = option.id"
          >
            <i class="bi me-1" :class="option.icon" aria-hidden="true"></i>{{ option.label }}
            <span v-if="trip.routes?.[option.id]" class="d-block small">
              {{ formatDuration(trip.routes[option.id].duration) }}
            </span>
          </button>
        </div>

        <div aria-live="polite">
          <p v-if="trip.loading" class="mb-0">
            <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Finding
            routes...
          </p>
          <div v-else-if="trip.error" class="alert alert-danger mb-0" role="alert">
            {{ trip.error }}
          </div>
          <div v-else-if="!route" class="alert alert-warning mb-0">
            No {{ mode.verb.toLowerCase() }} route is available for this trip. Try another travel
            mode.
          </div>
          <template v-else>
            <dl class="row mb-2">
              <dt class="col-6 fw-normal text-muted">Distance</dt>
              <dd class="col-6 mb-1 fw-semibold">{{ formatDistance(route.distance / 1000) }}</dd>
              <dt class="col-6 fw-normal text-muted">{{ mode.verb }} time</dt>
              <dd class="col-6 mb-0 fw-semibold">{{ formatDuration(route.duration) }}</dd>
            </dl>
            <p v-if="co2Message" class="co2-note small mb-0">
              <i class="bi bi-leaf me-1" aria-hidden="true"></i>{{ co2Message }}
            </p>
          </template>
        </div>
        <p class="form-text mb-0 mt-2">
          CO₂ estimate uses 181 g per km, the average for new cars in Australia (<a
            href="https://www.greenvehicleguide.gov.au/pages/UnderstandingEmissions/VehicleEmissions"
            target="_blank"
            rel="noopener noreferrer"
            >Green Vehicle Guide<span class="visually-hidden"> (opens in a new tab)</span></a
          >).
        </p>
      </template>
    </div>
  </section>
</template>

<style scoped>
#trip-heading:focus {
  outline: none;
}

.co2-note {
  background-color: var(--gr-cream);
  border-left: 4px solid var(--gr-green);
  padding: 0.5rem 0.75rem;
}
</style>
