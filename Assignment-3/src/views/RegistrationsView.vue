<script setup>
import { onMounted, ref } from 'vue'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { FilterMatchMode } from '@primevue/core/api'
import { db } from '@/firebase/init'

const STATUSES = ['confirmed', 'waitlist', 'cancelled']
const AGE_GROUPS = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const STATUS_BADGES = {
  confirmed: 'bg-success',
  waitlist: 'bg-warning text-dark',
  cancelled: 'bg-secondary',
}

const registrations = ref([])
const selected = ref([])
const loading = ref(true)
const loadError = ref('')

function createFilters() {
  return {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    eventName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    suburb: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ageGroup: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    createdLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  }
}

const filters = ref(createFilters())

function clearFilters() {
  filters.value = createFilters()
}

// Admin only: the route guard hides this page and Firestore rules reject the query for anyone else
onMounted(async () => {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'registrations'), orderBy('createdAt', 'desc')),
    )
    registrations.value = snapshot.docs.map((d) => {
      const data = d.data()
      const createdAt = data.createdAt?.toDate() ?? null
      return {
        id: d.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        eventId: data.eventId,
        eventName: data.eventName,
        suburb: data.suburb,
        ageGroup: data.ageGroup,
        status: data.status,
        source: data.source,
        createdAt,
        createdLabel: createdAt
          ? createdAt.toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '',
      }
    })
  } catch {
    loadError.value = 'Could not load registrations. Please refresh the page.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-5">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-2">
      <h1 class="mb-0">Volunteer Registrations</h1>
      <span class="badge bg-danger fs-6">ADMIN ONLY</span>
    </div>
    <p class="text-muted mb-4">
      <RouterLink to="/admin" class="text-greenroots">
        <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Admin Dashboard
      </RouterLink>
    </p>

    <div v-if="loadError" class="alert alert-danger" role="alert">{{ loadError }}</div>

    <DataTable
      v-model:filters="filters"
      v-model:selection="selected"
      :value="registrations"
      :loading="loading"
      data-key="id"
      filter-display="row"
      :global-filter-fields="[
        'name',
        'email',
        'eventName',
        'suburb',
        'ageGroup',
        'status',
        'createdLabel',
      ]"
      sort-field="createdAt"
      :sort-order="-1"
      removable-sort
      paginator
      :rows="10"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
      current-page-report-template="Showing {first} to {last} of {totalRecords} registrations"
      scrollable
      striped-rows
      size="small"
      :table-props="{ 'aria-labelledby': 'registrations-table-title' }"
    >
      <template #header>
        <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h2 id="registrations-table-title" class="h5 mb-0">All registrations</h2>
            <span class="small text-muted" role="status" aria-live="polite">
              {{ selected.length }} selected
            </span>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <div class="input-group input-group-sm table-search">
              <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
              <InputText
                v-model="filters.global.value"
                class="form-control"
                placeholder="Search all columns"
                aria-label="Search all registration columns"
              />
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearFilters">
              Clear filters
            </button>
          </div>
        </div>
      </template>

      <template #empty>No registrations match your search. Try clearing the filters.</template>
      <template #loading>Loading registrations...</template>

      <Column selection-mode="multiple" header-style="width: 3rem" />

      <Column
        field="name"
        header="Name"
        sortable
        :show-filter-menu="false"
        style="min-width: 12rem"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            size="small"
            class="w-100"
            placeholder="Name"
            aria-label="Filter by volunteer name"
            @input="filterCallback()"
          />
        </template>
      </Column>

      <Column
        field="email"
        header="Email"
        sortable
        :show-filter-menu="false"
        style="min-width: 14rem"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            size="small"
            class="w-100"
            placeholder="Email"
            aria-label="Filter by email"
            @input="filterCallback()"
          />
        </template>
      </Column>

      <Column
        field="eventName"
        header="Event"
        sortable
        :show-filter-menu="false"
        style="min-width: 14rem"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            size="small"
            class="w-100"
            placeholder="Event"
            aria-label="Filter by event"
            @input="filterCallback()"
          />
        </template>
      </Column>

      <Column
        field="suburb"
        header="Suburb"
        sortable
        :show-filter-menu="false"
        style="min-width: 9rem"
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

      <Column
        field="ageGroup"
        header="Age group"
        sortable
        :show-filter-menu="false"
        style="min-width: 8rem"
      >
        <template #filter="{ filterModel, filterCallback }">
          <Select
            v-model="filterModel.value"
            :options="AGE_GROUPS"
            size="small"
            class="w-100"
            placeholder="Any"
            show-clear
            aria-label="Filter by age group"
            @change="filterCallback()"
          />
        </template>
      </Column>

      <Column
        field="status"
        header="Status"
        sortable
        :show-filter-menu="false"
        style="min-width: 9rem"
      >
        <template #body="{ data }">
          <span class="badge" :class="STATUS_BADGES[data.status]">{{ data.status }}</span>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Select
            v-model="filterModel.value"
            :options="STATUSES"
            size="small"
            class="w-100"
            placeholder="Any"
            show-clear
            aria-label="Filter by status"
            @change="filterCallback()"
          />
        </template>
      </Column>

      <Column
        field="createdAt"
        filter-field="createdLabel"
        header="Registered"
        sortable
        :show-filter-menu="false"
        style="min-width: 9rem"
      >
        <template #body="{ data }">{{ data.createdLabel }}</template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            size="small"
            class="w-100"
            placeholder="e.g. Sept"
            aria-label="Filter by registration date"
            @input="filterCallback()"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.table-search {
  width: 16rem;
}
</style>
