<script setup>
import { computed, onMounted, ref } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useEventStore } from '@/stores/eventStore'

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

// Okabe-Ito colours stay distinguishable for the common types of colour blindness
const COLORS = { filled: '#0072B2', open: '#E69F00' }
const DAY_MS = 24 * 60 * 60 * 1000
const PERIODS = [
  { id: 'all', label: 'All events' },
  { id: '30', label: 'Next 30 days', days: 30 },
  { id: '90', label: 'Next 3 months', days: 90 },
]

const store = useEventStore()
const period = ref('all')
const selectedType = ref('')
const showTypeTable = ref(false)
const showMonthTable = ref(false)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => store.loadEvents())

const isoDate = (date) => date.toISOString().slice(0, 10)

const filteredEvents = computed(() => {
  const { days } = PERIODS.find((p) => p.id === period.value)
  const today = isoDate(new Date())
  const until = days ? isoDate(new Date(Date.now() + days * DAY_MS)) : null
  return store.events.filter(
    (event) =>
      (!until || (event.date >= today && event.date <= until)) &&
      (!selectedType.value || event.type === selectedType.value),
  )
})

const filled = (event) => event.totalSpots - event.spots

const totals = computed(() => {
  const capacity = filteredEvents.value.reduce((sum, event) => sum + event.totalSpots, 0)
  const placesFilled = filteredEvents.value.reduce((sum, event) => sum + filled(event), 0)
  return {
    events: filteredEvents.value.length,
    capacity,
    filled: placesFilled,
    open: capacity - placesFilled,
    suburbs: new Set(filteredEvents.value.map((event) => event.suburb)).size,
    percent: capacity ? Math.round((placesFilled / capacity) * 100) : 0,
  }
})

// Chart 1 groups by activity type; once a type is chosen it drills down to that type's events
const typeRows = computed(() => {
  if (selectedType.value) {
    return filteredEvents.value.map((event) => ({
      label: event.name,
      filled: filled(event),
      open: event.spots,
    }))
  }
  const byType = new Map()
  for (const event of filteredEvents.value) {
    const row = byType.get(event.type) ?? { label: event.type, filled: 0, open: 0 }
    row.filled += filled(event)
    row.open += event.spots
    byType.set(event.type, row)
  }
  return [...byType.values()].sort((a, b) => b.filled - a.filled)
})

const monthRows = computed(() => {
  const byMonth = new Map()
  for (const event of filteredEvents.value) {
    const key = event.date.slice(0, 7)
    const row = byMonth.get(key) ?? { key, events: 0, filled: 0, capacity: 0 }
    row.events += 1
    row.filled += filled(event)
    row.capacity += event.totalSpots
    byMonth.set(key, row)
  }
  return [...byMonth.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => {
      const [year, month] = row.key.split('-').map(Number)
      const label = new Date(year, month - 1).toLocaleDateString('en-AU', {
        month: 'short',
        year: 'numeric',
      })
      return { ...row, label }
    })
})

const typeChartData = computed(() => ({
  labels: typeRows.value.map((row) => row.label),
  datasets: [
    {
      label: 'Places filled',
      data: typeRows.value.map((row) => row.filled),
      backgroundColor: COLORS.filled,
    },
    {
      label: 'Places still open',
      data: typeRows.value.map((row) => row.open),
      backgroundColor: COLORS.open,
    },
  ],
}))

const monthChartData = computed(() => ({
  labels: monthRows.value.map((row) => row.label),
  datasets: [
    {
      label: 'Places filled',
      data: monthRows.value.map((row) => row.filled),
      borderColor: COLORS.filled,
      backgroundColor: COLORS.filled,
      pointStyle: 'circle',
      tension: 0.25,
    },
    {
      label: 'Total places',
      data: monthRows.value.map((row) => row.capacity),
      borderColor: COLORS.open,
      backgroundColor: COLORS.open,
      borderDash: [6, 4],
      pointStyle: 'rectRot',
      tension: 0.25,
    },
  ],
}))

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduceMotion ? false : { duration: 400 },
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Places' } },
    },
  }
}

const typeChartOptions = computed(() => ({
  ...baseOptions(),
  indexAxis: selectedType.value ? 'y' : 'x',
  scales: {
    x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
    y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
  },
  // Clicking a bar drills down into that activity type; the type filter does the same by keyboard
  onClick: (_event, elements) => {
    if (!selectedType.value && elements.length) {
      selectedType.value = typeRows.value[elements[0].index].label
    }
  },
  onHover: (event, elements) => {
    event.native.target.style.cursor =
      !selectedType.value && elements.length ? 'pointer' : 'default'
  },
}))

const monthChartOptions = computed(() => baseOptions())

const typeSummary = computed(() => {
  const [top] = [...typeRows.value].sort((a, b) => b.filled - a.filled)
  if (!top) return 'No events match the selected filters.'
  const subject = selectedType.value ? `${selectedType.value} events` : 'activity types'
  return `Across ${typeRows.value.length} ${subject}, ${top.label} has the most places filled: ${top.filled} filled and ${top.open} still open.`
})

const monthSummary = computed(() => {
  if (!monthRows.value.length) return 'No events match the selected filters.'
  const busiest = [...monthRows.value].sort((a, b) => b.filled - a.filled)[0]
  return `${monthRows.value.length} months shown. ${busiest.label} is the busiest month, with ${busiest.filled} of ${busiest.capacity} places filled across ${busiest.events} events.`
})

const chartHeight = computed(() =>
  selectedType.value ? `${Math.max(240, typeRows.value.length * 44)}px` : '320px',
)

function resetFilters() {
  period.value = 'all'
  selectedType.value = ''
}
</script>

<template>
  <div class="container py-5">
    <h1 class="mb-2">Our Impact</h1>
    <p class="text-muted mb-4">
      How Melbourne is turning up for GreenRoots, live from our event bookings. Use the filters to
      explore, select a bar to see the events behind it, or open the data tables.
    </p>

    <div v-if="store.loadError" class="alert alert-danger" role="alert">
      {{ store.loadError }}
    </div>

    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-sm-6 col-md-4">
            <label for="impact-period" class="form-label fw-semibold">Time range</label>
            <select id="impact-period" v-model="period" class="form-select">
              <option v-for="option in PERIODS" :key="option.id" :value="option.id">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <label for="impact-type" class="form-label fw-semibold">Activity type</label>
            <select id="impact-type" v-model="selectedType" class="form-select">
              <option value="">All activity types</option>
              <option v-for="type in store.eventTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
          <div class="col-12 col-md-4">
            <button
              type="button"
              class="btn btn-outline-secondary w-100"
              :disabled="period === 'all' && !selectedType"
              @click="resetFilters"
            >
              <i class="bi bi-x-circle me-1" aria-hidden="true"></i>Reset filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <section class="row g-3 mb-4" aria-label="Summary" aria-live="polite">
      <div class="col-6 col-lg-3">
        <div class="card shadow-sm h-100 text-center">
          <dl class="card-body mb-0 d-flex flex-column">
            <dt class="order-2 fw-normal text-muted">Events</dt>
            <dd class="order-1 h3 mb-0">{{ totals.events }}</dd>
          </dl>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card shadow-sm h-100 text-center">
          <dl class="card-body mb-0 d-flex flex-column">
            <dt class="order-2 fw-normal text-muted">Volunteer places filled</dt>
            <dd class="order-1 h3 mb-0">{{ totals.filled }}</dd>
          </dl>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card shadow-sm h-100 text-center">
          <dl class="card-body mb-0 d-flex flex-column">
            <dt class="order-2 fw-normal text-muted">Of {{ totals.capacity }} places taken</dt>
            <dd class="order-1 h3 mb-0">{{ totals.percent }}%</dd>
          </dl>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card shadow-sm h-100 text-center">
          <dl class="card-body mb-0 d-flex flex-column">
            <dt class="order-2 fw-normal text-muted">Suburbs reached</dt>
            <dd class="order-1 h3 mb-0">{{ totals.suburbs }}</dd>
          </dl>
        </div>
      </div>
    </section>

    <div v-if="store.loading" class="text-center text-muted py-5" role="status">
      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Loading
      events...
    </div>

    <div v-else class="row g-4">
      <section class="col-12 col-lg-6" aria-labelledby="type-chart-heading">
        <div class="card chart-card shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <h2 id="type-chart-heading" class="h5">
                {{ selectedType ? `${selectedType} events` : 'Places by activity type' }}
              </h2>
              <button
                v-if="selectedType"
                type="button"
                class="btn btn-sm btn-link p-0 text-nowrap"
                @click="selectedType = ''"
              >
                <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>All types
              </button>
            </div>
            <p id="type-chart-summary" class="small text-muted">{{ typeSummary }}</p>
            <div :style="{ height: chartHeight }">
              <Bar
                :data="typeChartData"
                :options="typeChartOptions"
                :aria-label="`Stacked bar chart of places filled and still open. ${typeSummary}`"
                aria-describedby="type-chart-summary"
              />
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary mt-3"
              :aria-expanded="showTypeTable"
              aria-controls="type-chart-table"
              @click="showTypeTable = !showTypeTable"
            >
              {{ showTypeTable ? 'Hide' : 'Show' }} data table
            </button>
            <div v-show="showTypeTable" id="type-chart-table" class="table-responsive mt-2">
              <table class="table table-sm mb-0">
                <caption class="visually-hidden">
                  Places filled and open by
                  {{
                    selectedType ? 'event' : 'activity type'
                  }}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{{ selectedType ? 'Event' : 'Activity type' }}</th>
                    <th scope="col" class="text-end">Filled</th>
                    <th scope="col" class="text-end">Open</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in typeRows" :key="row.label">
                    <th scope="row" class="fw-normal">{{ row.label }}</th>
                    <td class="text-end">{{ row.filled }}</td>
                    <td class="text-end">{{ row.open }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section class="col-12 col-lg-6" aria-labelledby="month-chart-heading">
        <div class="card chart-card shadow-sm h-100">
          <div class="card-body">
            <h2 id="month-chart-heading" class="h5">Volunteering by month</h2>
            <p id="month-chart-summary" class="small text-muted">{{ monthSummary }}</p>
            <div style="height: 320px">
              <Line
                :data="monthChartData"
                :options="monthChartOptions"
                :aria-label="`Line chart of places filled and total places by month. ${monthSummary}`"
                aria-describedby="month-chart-summary"
              />
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary mt-3"
              :aria-expanded="showMonthTable"
              aria-controls="month-chart-table"
              @click="showMonthTable = !showMonthTable"
            >
              {{ showMonthTable ? 'Hide' : 'Show' }} data table
            </button>
            <div v-show="showMonthTable" id="month-chart-table" class="table-responsive mt-2">
              <table class="table table-sm mb-0">
                <caption class="visually-hidden">
                  Events, places filled and total places by month
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col" class="text-end">Events</th>
                    <th scope="col" class="text-end">Filled</th>
                    <th scope="col" class="text-end">Total places</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in monthRows" :key="row.key">
                    <th scope="row" class="fw-normal">{{ row.label }}</th>
                    <td class="text-end">{{ row.events }}</td>
                    <td class="text-end">{{ row.filled }}</td>
                    <td class="text-end">{{ row.capacity }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* The site-wide card hover lift makes charts jump while you read the tooltips */
.chart-card:hover {
  transform: none;
}
</style>
