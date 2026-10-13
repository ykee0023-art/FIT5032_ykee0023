<script setup>
import { computed, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { FilterMatchMode } from '@primevue/core/api'
import { useRatingStore } from '@/stores/ratingStore'

const props = defineProps({
  events: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const ratingStore = useRatingStore()

function createFilters() {
  return {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    dateLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
    suburb: { value: null, matchMode: FilterMatchMode.CONTAINS },
    type: { value: null, matchMode: FilterMatchMode.EQUALS },
    spots: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    rating: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
  }
}

const filters = ref(createFilters())

// The date column sorts on the ISO date but is searched on the label people actually read
const rows = computed(() =>
  props.events.map((event) => ({
    ...event,
    dateLabel: new Date(event.date).toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    rating: ratingStore.getAverageRating(event.id) || event.rating,
  })),
)

const eventTypes = computed(() => [...new Set(props.events.map((e) => e.type))].sort())

function clearFilters() {
  filters.value = createFilters()
}
</script>

<template>
  <DataTable
    v-model:filters="filters"
    :value="rows"
    :loading="loading"
    data-key="id"
    filter-display="row"
    :global-filter-fields="['name', 'dateLabel', 'suburb', 'location', 'type']"
    sort-field="date"
    :sort-order="1"
    removable-sort
    paginator
    :rows="10"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
    current-page-report-template="Showing {first} to {last} of {totalRecords} events"
    scrollable
    striped-rows
    size="small"
    :table-props="{ 'aria-labelledby': 'events-table-title' }"
  >
    <template #header>
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <h2 id="events-table-title" class="h5 mb-0">All events</h2>
        <div class="d-flex flex-wrap gap-2">
          <div class="input-group input-group-sm table-search">
            <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
            <InputText
              v-model="filters.global.value"
              class="form-control"
              placeholder="Search all columns"
              aria-label="Search all event columns"
            />
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearFilters">
            Clear filters
          </button>
        </div>
      </div>
    </template>

    <template #empty>No events match your search. Try clearing the filters.</template>
    <template #loading>Loading events...</template>

    <Column field="name" header="Event" sortable :show-filter-menu="false" style="min-width: 15rem">
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          size="small"
          class="w-100"
          placeholder="Name"
          aria-label="Filter by event name"
          @input="filterCallback()"
        />
      </template>
    </Column>

    <Column
      field="date"
      filter-field="dateLabel"
      header="Date"
      sortable
      :show-filter-menu="false"
      style="min-width: 11rem"
    >
      <template #body="{ data }">{{ data.dateLabel }}</template>
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          size="small"
          class="w-100"
          placeholder="e.g. Nov"
          aria-label="Filter by date"
          @input="filterCallback()"
        />
      </template>
    </Column>

    <Column
      field="suburb"
      header="Suburb"
      sortable
      :show-filter-menu="false"
      style="min-width: 10rem"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          size="small"
          class="w-100"
          placeholder="Suburb"
          aria-label="Filter by suburb"
          @input="filterCallback()"
        />
      </template>
    </Column>

    <Column field="type" header="Type" sortable :show-filter-menu="false" style="min-width: 10rem">
      <template #filter="{ filterModel, filterCallback }">
        <Select
          v-model="filterModel.value"
          :options="eventTypes"
          size="small"
          class="w-100"
          placeholder="Any type"
          show-clear
          aria-label="Filter by event type"
          @change="filterCallback()"
        />
      </template>
    </Column>

    <Column
      field="spots"
      header="Spots left"
      sortable
      data-type="numeric"
      :show-filter-menu="false"
      style="min-width: 8rem"
    >
      <template #body="{ data }">
        <span v-if="data.spots === 0" class="text-danger fw-semibold">Full</span>
        <span v-else>{{ data.spots }}</span>
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <InputNumber
          v-model="filterModel.value"
          size="small"
          class="w-100"
          input-class="w-100"
          :min="0"
          placeholder="At least"
          aria-label="Filter by minimum spots left"
          @update:model-value="filterCallback()"
        />
      </template>
    </Column>

    <Column
      field="rating"
      header="Rating"
      sortable
      data-type="numeric"
      :show-filter-menu="false"
      style="min-width: 8rem"
    >
      <template #body="{ data }">
        <i class="bi bi-star-fill text-warning me-1" aria-hidden="true"></i
        >{{ data.rating.toFixed(1) }}
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <InputNumber
          v-model="filterModel.value"
          size="small"
          class="w-100"
          input-class="w-100"
          :min="0"
          :max="5"
          :step="0.5"
          :min-fraction-digits="1"
          placeholder="At least"
          aria-label="Filter by minimum rating"
          @update:model-value="filterCallback()"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
.table-search {
  width: 16rem;
}
</style>
