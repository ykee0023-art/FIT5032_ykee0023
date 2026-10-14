<script setup>
import { reactive } from 'vue'

const PUBLIC_BASE = 'https://fit5032-1b795.web.app/api'

const ENDPOINTS = [
  {
    id: 'list-events',
    path: '/events',
    title: 'List events',
    description: 'All events, soonest first. Filters can be combined.',
    params: [
      {
        name: 'type',
        in: 'query',
        example: 'Tree planting',
        help: 'Activity type: Tree planting, Urban garden, Biodiversity, Habitat care or Education.',
      },
      { name: 'suburb', in: 'query', example: '', help: 'Exact suburb name, e.g. Fitzroy.' },
      {
        name: 'from',
        in: 'query',
        example: '',
        help: 'Only events on or after this date (YYYY-MM-DD).',
      },
      {
        name: 'limit',
        in: 'query',
        example: '3',
        help: 'How many events to return, 1 to 50 (default 20).',
      },
    ],
  },
  {
    id: 'get-event',
    path: '/events/{id}',
    title: 'Get one event',
    description: 'A single event by its ID. Returns 404 if there is no such event.',
    params: [
      {
        name: 'id',
        in: 'path',
        example: '3',
        required: true,
        help: 'The event ID, a whole number.',
      },
    ],
  },
  {
    id: 'stats',
    path: '/stats',
    title: 'Impact statistics',
    description:
      'Totals across all events: places filled, confirmed volunteers and a breakdown by activity type.',
    params: [],
  },
]

const STATUS_CODES = [
  { code: 200, meaning: 'Success. The body has a data object and, for lists, a meta object.' },
  { code: 400, meaning: 'A parameter is invalid, e.g. limit=0 or from=2026-13-01.' },
  { code: 404, meaning: 'No event has that ID, or the route does not exist.' },
  { code: 405, meaning: 'The method is not GET. The API is read-only.' },
  { code: 500, meaning: 'Something went wrong on our side. Try again later.' },
]

const values = reactive(
  Object.fromEntries(
    ENDPOINTS.map((endpoint) => [
      endpoint.id,
      Object.fromEntries(endpoint.params.map((param) => [param.name, param.example])),
    ]),
  ),
)
const responses = reactive(
  Object.fromEntries(ENDPOINTS.map((endpoint) => [endpoint.id, { loading: false }])),
)
const copied = reactive({})

function requestPath(endpoint) {
  const input = values[endpoint.id]
  let path = endpoint.path
  const query = new URLSearchParams()
  for (const param of endpoint.params) {
    const value = String(input[param.name] ?? '').trim()
    if (param.in === 'path') path = path.replace(`{${param.name}}`, encodeURIComponent(value))
    else if (value) query.set(param.name, value)
  }
  const search = query.toString()
  return search ? `${path}?${search}` : path
}

const curlCommand = (endpoint) => `curl "${PUBLIC_BASE}${requestPath(endpoint)}"`

async function copyCurl(endpoint) {
  try {
    await navigator.clipboard.writeText(curlCommand(endpoint))
    copied[endpoint.id] = 'Copied'
  } catch {
    copied[endpoint.id] = 'Copy failed. Select the text instead.'
  }
  setTimeout(() => (copied[endpoint.id] = ''), 2000)
}

// Same-origin request: Firebase Hosting (or the Vite proxy in development) forwards /api to the function
async function tryIt(endpoint) {
  const state = responses[endpoint.id]
  Object.assign(state, { loading: true, error: '', status: null })
  const started = performance.now()
  try {
    const response = await fetch(`/api${requestPath(endpoint)}`, {
      headers: { Accept: 'application/json' },
    })
    const text = await response.text()
    let body = text
    try {
      body = JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      // Not JSON, so show it as it is
    }
    Object.assign(state, {
      status: response.status,
      ok: response.ok,
      ms: Math.round(performance.now() - started),
      body,
    })
  } catch {
    state.error = 'The request could not be sent. Please check your connection.'
  } finally {
    state.loading = false
  }
}
</script>

<template>
  <div class="container py-5">
    <h1 class="mb-2">Developer API</h1>
    <p class="lead text-muted mb-4">
      Councils, schools and community groups can show GreenRoots events on their own websites. The
      API is free, read-only and does not need a key.
    </p>

    <section class="card shadow-sm mb-5 api-card" aria-labelledby="api-basics-heading">
      <div class="card-body">
        <h2 id="api-basics-heading" class="h5">The basics</h2>
        <dl class="row mb-0">
          <dt class="col-sm-3">Base URL</dt>
          <dd class="col-sm-9">
            <code>{{ PUBLIC_BASE }}</code>
          </dd>
          <dt class="col-sm-3">Format</dt>
          <dd class="col-sm-9">
            JSON (UTF-8). Successful responses have a <code>data</code> object.
          </dd>
          <dt class="col-sm-3">Methods</dt>
          <dd class="col-sm-9">GET only. Other methods return 405.</dd>
          <dt class="col-sm-3">CORS</dt>
          <dd class="col-sm-9">Any website can call the API from the browser.</dd>
          <dt class="col-sm-3">Caching</dt>
          <dd class="col-sm-9">Responses may be cached for 60 seconds.</dd>
          <dt class="col-sm-3">Privacy</dt>
          <dd class="col-sm-9 mb-0">
            Only event details and totals are published, never volunteers' names or contact details.
          </dd>
        </dl>
      </div>
    </section>

    <h2 class="h4 mb-3">Endpoints</h2>
    <section
      v-for="endpoint in ENDPOINTS"
      :key="endpoint.id"
      class="card shadow-sm mb-4 api-card"
      :aria-labelledby="`${endpoint.id}-heading`"
    >
      <div class="card-body">
        <h3 :id="`${endpoint.id}-heading`" class="h5 d-flex flex-wrap align-items-center gap-2">
          <span class="badge text-bg-success">GET</span>
          <code class="fs-6">{{ endpoint.path }}</code>
          <span class="text-muted fw-normal">{{ endpoint.title }}</span>
        </h3>
        <p>{{ endpoint.description }}</p>

        <form
          v-if="endpoint.params.length"
          class="row g-3 mb-3"
          :aria-label="`Parameters for ${endpoint.title}`"
          @submit.prevent="tryIt(endpoint)"
        >
          <div v-for="param in endpoint.params" :key="param.name" class="col-12 col-md-6 col-lg-3">
            <label :for="`${endpoint.id}-${param.name}`" class="form-label mb-1">
              <code>{{ param.name }}</code>
              <span class="small text-muted">
                ({{ param.in }}{{ param.required ? ', required' : ', optional' }})
              </span>
            </label>
            <input
              :id="`${endpoint.id}-${param.name}`"
              v-model="values[endpoint.id][param.name]"
              type="text"
              class="form-control form-control-sm"
              maxlength="50"
              :aria-describedby="`${endpoint.id}-${param.name}-help`"
            />
            <div :id="`${endpoint.id}-${param.name}-help`" class="form-text">{{ param.help }}</div>
          </div>
          <button type="submit" class="visually-hidden" tabindex="-1">Send request</button>
        </form>

        <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
          <pre
            class="curl flex-grow-1 mb-0"
            tabindex="0"
            :aria-label="`curl example for ${endpoint.title}`"
          ><code>{{ curlCommand(endpoint) }}</code></pre>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="copyCurl(endpoint)"
          >
            <i class="bi bi-clipboard me-1" aria-hidden="true"></i>Copy
          </button>
          <button
            type="button"
            class="btn btn-sm btn-greenroots"
            :disabled="responses[endpoint.id].loading"
            @click="tryIt(endpoint)"
          >
            <span
              v-if="responses[endpoint.id].loading"
              class="spinner-border spinner-border-sm me-1"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-play-fill me-1" aria-hidden="true"></i>Try it
          </button>
        </div>
        <span class="visually-hidden" aria-live="polite">{{ copied[endpoint.id] }}</span>

        <div aria-live="polite">
          <p v-if="responses[endpoint.id].error" class="text-danger mb-0" role="alert">
            {{ responses[endpoint.id].error }}
          </p>
          <template v-else-if="responses[endpoint.id].status">
            <p class="small mb-1">
              Response:
              <span
                class="badge"
                :class="responses[endpoint.id].ok ? 'text-bg-success' : 'text-bg-danger'"
              >
                {{ responses[endpoint.id].status }}
              </span>
              <span class="text-muted ms-1">in {{ responses[endpoint.id].ms }} ms</span>
            </p>
            <pre
              class="response mb-0"
              tabindex="0"
              :aria-label="`Response body for ${endpoint.title}`"
            ><code>{{ responses[endpoint.id].body }}</code></pre>
          </template>
        </div>
      </div>
    </section>

    <section class="card shadow-sm api-card" aria-labelledby="status-codes-heading">
      <div class="card-body">
        <h2 id="status-codes-heading" class="h5">Status codes</h2>
        <p>Errors return the matching status and a body like:</p>
        <pre
          class="response mb-3"
          tabindex="0"
          aria-label="Example error body"
        ><code>{ "error": { "status": 404, "message": "There is no event with ID 999." } }</code></pre>
        <table class="table table-sm mb-0">
          <caption class="visually-hidden">
            HTTP status codes returned by the API
          </caption>
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in STATUS_CODES" :key="row.code">
              <th scope="row">{{ row.code }}</th>
              <td>{{ row.meaning }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Cards lift on hover elsewhere on the site, which is distracting on a page full of inputs */
.api-card:hover {
  transform: none;
}

.curl,
.response {
  background-color: #f6f8fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.response {
  max-height: 22rem;
  overflow: auto;
}
</style>
