import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import eventsData from '@/data/events.json'

export const useEventStore = defineStore('events', () => {
  const events = ref([])
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

  function loadEvents() {
    events.value = eventsData
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedType.value = ''
  }

  return {
    events,
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
