<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { newSearchSession, retrievePlace, suggestPlaces } from '@/utils/mapboxApi'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 3

const emit = defineEmits(['select'])

const input = ref(null)
const query = ref('')
const suggestions = ref([])
const open = ref(false)
const activeIndex = ref(-1)
const searching = ref(false)
const message = ref('')
const error = ref('')

let timer = null
let controller = null
let sessionToken = newSearchSession()
// Set when a place is chosen, so filling the input with its name does not search again
let chosenName = ''

function reset() {
  clearTimeout(timer)
  controller?.abort()
  suggestions.value = []
  open.value = false
  activeIndex.value = -1
  searching.value = false
  message.value = ''
}

async function search(text) {
  const current = new AbortController()
  controller = current
  try {
    const results = await suggestPlaces(text, sessionToken, current.signal)
    suggestions.value = results
    activeIndex.value = -1
    open.value = results.length > 0
    message.value = results.length
      ? `${results.length} places found. Use the up and down arrow keys to choose one.`
      : `No places match "${text}". Try a suburb, park or street name.`
  } catch (searchError) {
    if (searchError.name === 'AbortError') return
    suggestions.value = []
    open.value = false
    error.value = 'Place search is not available right now. Please try again, or use your location.'
  } finally {
    if (controller === current) searching.value = false
  }
}

watch(query, (value) => {
  const text = value.trim()
  error.value = ''
  if (text === chosenName) return
  reset()
  if (text.length < MIN_QUERY_LENGTH) return
  searching.value = true
  timer = setTimeout(() => search(text), DEBOUNCE_MS)
})

async function choose(suggestion) {
  reset()
  chosenName = suggestion.name
  query.value = suggestion.name
  searching.value = true
  try {
    const place = await retrievePlace(suggestion.id, sessionToken)
    emit('select', { label: place.name, lng: place.lng, lat: place.lat })
  } catch {
    error.value = 'That place could not be loaded. Please choose another result.'
  } finally {
    searching.value = false
    sessionToken = newSearchSession()
  }
}

function move(step) {
  if (suggestions.value.length === 0) return
  open.value = true
  const count = suggestions.value.length
  activeIndex.value = (activeIndex.value + step + count) % count
}

function handleKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter' && open.value) {
    event.preventDefault()
    choose(suggestions.value[Math.max(activeIndex.value, 0)])
  } else if (event.key === 'Escape') {
    if (open.value) open.value = false
    else query.value = ''
  }
}

function clear() {
  chosenName = ''
  query.value = ''
  error.value = ''
  reset()
}

defineExpose({ focus: () => input.value?.focus(), clear })

onBeforeUnmount(reset)
</script>

<template>
  <div class="position-relative">
    <label for="place-search" class="form-label fw-semibold">Search for a place</label>
    <div class="input-group">
      <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
      <input
        id="place-search"
        ref="input"
        v-model="query"
        type="text"
        class="form-control"
        role="combobox"
        autocomplete="off"
        maxlength="100"
        placeholder="Suburb, park or address"
        aria-autocomplete="list"
        aria-controls="place-search-results"
        aria-describedby="place-search-help"
        :aria-expanded="open"
        :aria-activedescendant="activeIndex >= 0 ? `place-option-${activeIndex}` : undefined"
        @keydown="handleKeydown"
        @blur="open = false"
      />
      <span v-if="searching" class="input-group-text">
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      </span>
    </div>
    <span id="place-search-help" class="visually-hidden">
      Type at least 3 characters, then choose a place from the list.
    </span>

    <ul
      v-show="open"
      id="place-search-results"
      role="listbox"
      aria-label="Matching places"
      class="list-group position-absolute w-100 shadow place-search-results"
    >
      <li
        v-for="(suggestion, index) in suggestions"
        :id="`place-option-${index}`"
        :key="suggestion.id"
        role="option"
        class="list-group-item list-group-item-action"
        :class="{ active: index === activeIndex }"
        :aria-selected="index === activeIndex"
        @mousedown.prevent
        @click="choose(suggestion)"
      >
        <div class="fw-semibold">{{ suggestion.name }}</div>
        <div class="small" :class="{ 'text-muted': index !== activeIndex }">
          {{ suggestion.detail }}
        </div>
      </li>
    </ul>

    <p v-if="error" class="small text-danger mt-1 mb-0" role="alert">{{ error }}</p>
    <p v-else-if="message && !suggestions.length" class="small text-muted mt-1 mb-0">
      {{ message }}
    </p>
    <span class="visually-hidden" aria-live="polite">{{ message }}</span>
  </div>
</template>

<style scoped>
.place-search-results {
  z-index: 1050;
  max-height: 320px;
  overflow-y: auto;
  cursor: pointer;
}

.place-search-results .active {
  background-color: var(--gr-green);
  border-color: var(--gr-green);
}
</style>
