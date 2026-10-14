<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Timestamp,
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase/init'
import { useAuthStore } from '@/stores/authStore'
import { useEventStore } from '@/stores/eventStore'

const DAY_MS = 24 * 60 * 60 * 1000
const EMAIL_TYPES = { single: 'Single', confirmation: 'Confirmation', bulk: 'Bulk' }

const authStore = useAuthStore()
const eventStore = useEventStore()
const users = ref([])
const stats = ref(null)
const recentEmails = ref([])
const loading = ref(false)
const loadError = ref('')
const updatedAt = ref(null)

// Count aggregation queries return only a number, so no user or registration data is downloaded
async function count(source) {
  const snapshot = await getCountFromServer(source)
  return snapshot.data().count
}

async function loadStats() {
  const usersRef = collection(db, 'users')
  const registrationsRef = collection(db, 'registrations')
  const emailLogsRef = collection(db, 'emailLogs')
  const weekAgo = Timestamp.fromMillis(Date.now() - 7 * DAY_MS)

  const [
    totalUsers,
    volunteers,
    admins,
    newUsers,
    registrations,
    confirmed,
    waitlisted,
    websiteRegistrations,
    newRegistrations,
    messages,
    emailsSent,
    emailsFailed,
  ] = await Promise.all([
    count(usersRef),
    count(query(usersRef, where('role', '==', 'volunteer'))),
    count(query(usersRef, where('role', '==', 'admin'))),
    count(query(usersRef, where('createdAt', '>=', weekAgo))),
    count(registrationsRef),
    count(query(registrationsRef, where('status', '==', 'confirmed'))),
    count(query(registrationsRef, where('status', '==', 'waitlist'))),
    count(query(registrationsRef, where('source', '==', 'website'))),
    count(query(registrationsRef, where('createdAt', '>=', weekAgo))),
    count(collection(db, 'messages')),
    count(query(emailLogsRef, where('status', '==', 'sent'))),
    count(query(emailLogsRef, where('status', '==', 'failed'))),
  ])

  stats.value = {
    totalUsers,
    volunteers,
    admins,
    newUsers,
    registrations,
    confirmed,
    waitlisted,
    cancelled: registrations - confirmed - waitlisted,
    websiteRegistrations,
    newRegistrations,
    messages,
    emailsSent,
    emailsFailed,
  }
}

async function loadRecentEmails() {
  const snapshot = await getDocs(
    query(collection(db, 'emailLogs'), orderBy('createdAt', 'desc'), limit(10)),
  )
  recentEmails.value = snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      to: data.to,
      subject: data.subject,
      type: EMAIL_TYPES[data.type] ?? data.type,
      status: data.status,
      sentAt: data.createdAt?.toDate() ?? null,
    }
  })
}

async function refresh() {
  loading.value = true
  loadError.value = ''
  try {
    const [, , userList] = await Promise.all([
      loadStats(),
      loadRecentEmails(),
      authStore.getAllUsers(),
      eventStore.loadEvents(),
    ])
    users.value = userList
    updatedAt.value = new Date()
  } catch {
    loadError.value = 'Could not load the dashboard. Please check your connection and try again.'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

const upcomingEvents = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return eventStore.events.filter((event) => event.date >= today)
})

const capacity = computed(() => {
  const total = upcomingEvents.value.reduce((sum, event) => sum + event.totalSpots, 0)
  const open = upcomingEvents.value.reduce((sum, event) => sum + event.spots, 0)
  return {
    total,
    filled: total - open,
    percent: total ? Math.round(((total - open) / total) * 100) : 0,
  }
})

// Upcoming events closest to full, so the admin can see where to add capacity or a waitlist
const fillingUp = computed(() =>
  upcomingEvents.value
    .map((event) => ({
      ...event,
      percent: Math.round(((event.totalSpots - event.spots) / event.totalSpots) * 100),
    }))
    .sort((a, b) => b.percent - a.percent || a.date.localeCompare(b.date))
    .slice(0, 5),
)

const roleShare = computed(() => {
  const total = stats.value?.totalUsers || 0
  if (!total) return { volunteers: 0, admins: 0 }
  return {
    volunteers: Math.round((stats.value.volunteers / total) * 100),
    admins: Math.round((stats.value.admins / total) * 100),
  }
})

const userCards = computed(() => [
  {
    label: 'Total users',
    value: stats.value?.totalUsers,
    icon: 'bi-people',
    tone: 'text-greenroots',
  },
  {
    label: 'Volunteers',
    value: stats.value?.volunteers,
    icon: 'bi-person-heart',
    tone: 'text-success',
  },
  { label: 'Admins', value: stats.value?.admins, icon: 'bi-shield-lock', tone: 'text-danger' },
  {
    label: 'New users (7 days)',
    value: stats.value?.newUsers,
    icon: 'bi-person-plus',
    tone: 'text-primary',
  },
])

const activityCards = computed(() => {
  const s = stats.value
  return [
    {
      label: 'Registrations',
      value: s?.registrations,
      icon: 'bi-clipboard-check',
      detail:
        s && `${s.confirmed} confirmed · ${s.waitlisted} waitlisted · ${s.cancelled} cancelled`,
    },
    {
      label: 'New registrations (7 days)',
      value: s?.newRegistrations,
      icon: 'bi-graph-up-arrow',
      detail: s && `${s.websiteRegistrations} made on this website in total`,
    },
    {
      label: 'Upcoming places filled',
      value: s && `${capacity.value.percent}%`,
      icon: 'bi-calendar-check',
      detail: `${capacity.value.filled} of ${capacity.value.total} spots across ${upcomingEvents.value.length} events`,
    },
    {
      label: 'Emails sent',
      value: s?.emailsSent,
      icon: 'bi-envelope-check',
      detail: s && `${s.emailsFailed} failed · ${s.messages} contact messages received`,
    },
  ]
})

function formatDateTime(date) {
  return date
    ? date.toLocaleString('en-AU', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'
}
</script>

<template>
  <div class="container py-5">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-2">
      <h1 class="mb-0">Admin Dashboard</h1>
      <span class="badge bg-danger fs-6">ADMIN ONLY</span>
      <div class="ms-md-auto d-flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="loading"
          @click="refresh"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-1"
            aria-hidden="true"
          ></span>
          <i v-else class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Refresh
        </button>
        <RouterLink to="/admin/registrations" class="btn btn-greenroots">
          <i class="bi bi-table me-1" aria-hidden="true"></i>View volunteer registrations
        </RouterLink>
      </div>
    </div>
    <p class="text-muted mb-4" aria-live="polite">
      <template v-if="loading">Loading the latest figures...</template>
      <template v-else-if="updatedAt">Figures as of {{ formatDateTime(updatedAt) }}.</template>
    </p>

    <div v-if="loadError" class="alert alert-danger" role="alert">{{ loadError }}</div>

    <section class="mb-5" aria-labelledby="users-heading">
      <h2 id="users-heading" class="h4 mb-3">Users</h2>
      <div class="row g-3 mb-3">
        <div v-for="card in userCards" :key="card.label" class="col-6 col-md-3">
          <div class="card text-center shadow-sm h-100">
            <div class="card-body">
              <i class="bi display-6" :class="[card.icon, card.tone]" aria-hidden="true"></i>
              <p class="h3 mt-2 mb-0">{{ card.value ?? '—' }}</p>
              <p class="text-muted mb-0">{{ card.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="stats?.totalUsers" class="card shadow-sm">
        <div class="card-body">
          <p class="fw-semibold mb-2">Types of users</p>
          <div
            class="progress-stacked mb-2"
            role="img"
            :aria-label="`${roleShare.volunteers}% volunteers and ${roleShare.admins}% admins`"
          >
            <div class="progress" :style="{ width: `${roleShare.volunteers}%` }">
              <div class="progress-bar bg-success"></div>
            </div>
            <div class="progress" :style="{ width: `${roleShare.admins}%` }">
              <div class="progress-bar bg-danger"></div>
            </div>
          </div>
          <p class="small mb-0">
            <i class="bi bi-square-fill text-success me-1" aria-hidden="true"></i>Volunteers
            {{ stats.volunteers }} ({{ roleShare.volunteers }}%)
            <i class="bi bi-square-fill text-danger ms-3 me-1" aria-hidden="true"></i>Admins
            {{ stats.admins }} ({{ roleShare.admins }}%)
          </p>
        </div>
      </div>
    </section>

    <section class="mb-5" aria-labelledby="activity-heading">
      <h2 id="activity-heading" class="h4 mb-3">Volunteering activity</h2>
      <div class="row g-3">
        <div v-for="card in activityCards" :key="card.label" class="col-12 col-sm-6 col-lg-3">
          <div class="card shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center gap-2 text-muted mb-1">
                <i class="bi" :class="card.icon" aria-hidden="true"></i>{{ card.label }}
              </div>
              <p class="h3 mb-1">{{ card.value ?? '—' }}</p>
              <p class="small text-muted mb-0">{{ card.detail }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="row g-4 mb-5">
      <section class="col-12 col-lg-5" aria-labelledby="filling-heading">
        <div class="card shadow-sm h-100">
          <div class="card-header">
            <h2 id="filling-heading" class="h5 mb-0">Events filling up</h2>
          </div>
          <ul class="list-group list-group-flush">
            <li v-for="event in fillingUp" :key="event.id" class="list-group-item">
              <div class="d-flex justify-content-between gap-2">
                <span class="fw-semibold">{{ event.name }}</span>
                <span class="small text-muted flex-shrink-0">
                  {{ event.totalSpots - event.spots }} / {{ event.totalSpots }}
                </span>
              </div>
              <div
                class="progress mt-1"
                role="progressbar"
                :aria-label="`${event.name} places filled`"
                :aria-valuenow="event.percent"
                aria-valuemin="0"
                aria-valuemax="100"
                style="height: 0.6rem"
              >
                <div
                  class="progress-bar"
                  :class="
                    event.percent >= 100
                      ? 'bg-danger'
                      : event.percent >= 75
                        ? 'bg-warning'
                        : 'bg-success'
                  "
                  :style="{ width: `${event.percent}%` }"
                ></div>
              </div>
            </li>
            <li v-if="!fillingUp.length && !loading" class="list-group-item text-muted">
              No upcoming events.
            </li>
          </ul>
        </div>
      </section>

      <section class="col-12 col-lg-7" aria-labelledby="emails-heading">
        <div class="card shadow-sm h-100">
          <div class="card-header">
            <h2 id="emails-heading" class="h5 mb-0">Recent email activity</h2>
          </div>
          <div class="table-responsive">
            <table class="table table-sm mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th scope="col">Sent</th>
                  <th scope="col">Type</th>
                  <th scope="col">To</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="email in recentEmails" :key="email.id">
                  <td class="text-nowrap">{{ formatDateTime(email.sentAt) }}</td>
                  <td>{{ email.type }}</td>
                  <td class="text-break">{{ email.to }}</td>
                  <td class="text-break">{{ email.subject }}</td>
                  <td>
                    <span
                      class="badge"
                      :class="email.status === 'sent' ? 'text-bg-success' : 'text-bg-danger'"
                    >
                      {{ email.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!recentEmails.length && !loading">
                  <td colspan="5" class="text-muted">No emails have been sent yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <section class="card shadow-sm" aria-labelledby="registered-users-heading">
      <div class="card-header">
        <h2 id="registered-users-heading" class="h5 mb-0">
          <i class="bi bi-people me-2" aria-hidden="true"></i>Registered Users
        </h2>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="badge" :class="user.role === 'admin' ? 'bg-danger' : 'bg-success'">
                  {{ user.role }}
                </span>
              </td>
              <td>
                {{ new Date(user.createdAt).toLocaleDateString('en-AU') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
