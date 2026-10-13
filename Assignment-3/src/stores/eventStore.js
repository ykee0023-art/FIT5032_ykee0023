import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, getDocs, orderBy, query as firestoreQuery } from 'firebase/firestore'
import { db } from '@/firebase/init'

export const useEventStore = defineStore('events', () => {
  const events = ref([])
  const loading = ref(false)
  const loadError = ref('')
  const searchQuery = ref('')
  const selectedType = ref('')

  const filteredEvents = computed(() => {
    let result = events.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (event) =>
          event.name.toLowerCase().includes(query) || event.suburb.toLowerCase().includes(query),
      )
    }

    if (selectedType.value) {
      result = result.filter((event) => event.type === selectedType.value)
    }

    return result
  })

  const eventTypes = computed(() => {
    return [...new Set(events.value.map((e) => e.type))]
  })

  const totalEvents = computed(() => events.value.length)

  const averageRating = computed(() => {
    if (events.value.length === 0) return 0
    const sum = events.value.reduce((acc, e) => acc + e.rating, 0)
    return (sum / events.value.length).toFixed(1)
  })

  const totalSpots = computed(() => {
    return events.value.reduce((acc, e) => acc + e.spots, 0)
  })

  async function loadEvents() {
    loading.value = true
    loadError.value = ''
    try {
      const snapshot = await getDocs(firestoreQuery(collection(db, 'events'), orderBy('date')))
      events.value = snapshot.docs.map((d) => d.data())
    } catch {
      loadError.value = 'Could not load events. Please check your connection and refresh the page.'
    } finally {
      loading.value = false
    }
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedType.value = ''
  }

  return {
    events,
    loading,
    loadError,
    searchQuery,
    selectedType,
    filteredEvents,
    eventTypes,
    totalEvents,
    averageRating,
    totalSpots,
    loadEvents,
    clearFilters,
  }
})
