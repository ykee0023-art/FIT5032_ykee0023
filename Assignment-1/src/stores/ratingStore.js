import { defineStore } from 'pinia'
import { ref } from 'vue'

const RATINGS_KEY = 'greenroots_ratings'

export const useRatingStore = defineStore('ratings', () => {
  const ratings = ref({})

  function loadRatings() {
    ratings.value = JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}')
  }

  function saveRatings() {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings.value))
  }

  function getAverageRating(eventId) {
    const entries = ratings.value[eventId] || []
    if (entries.length === 0) return 0
    const sum = entries.reduce((acc, e) => acc + e.rating, 0)
    return Number((sum / entries.length).toFixed(1))
  }

  function getRatingCount(eventId) {
    return (ratings.value[eventId] || []).length
  }

  function getUserRating(eventId, userId) {
    const entries = ratings.value[eventId] || []
    const entry = entries.find((e) => e.userId === userId)
    return entry ? entry.rating : 0
  }

  function getUserRatings(userId) {
    const result = []
    for (const [eventId, entries] of Object.entries(ratings.value)) {
      const entry = entries.find((e) => e.userId === userId)
      if (entry) {
        result.push({ eventId: Number(eventId), ...entry })
      }
    }
    return result
  }

  function submitRating(eventId, userId, rating) {
    if (!ratings.value[eventId]) {
      ratings.value[eventId] = []
    }
    const entries = ratings.value[eventId]
    const existing = entries.findIndex((e) => e.userId === userId)

    const ratingEntry = {
      userId,
      rating,
      timestamp: new Date().toISOString(),
    }

    if (existing >= 0) {
      entries[existing] = ratingEntry
    } else {
      entries.push(ratingEntry)
    }

    saveRatings()
  }

  function getOverallAverage() {
    const allEntries = Object.values(ratings.value).flat()
    if (allEntries.length === 0) return 0
    const sum = allEntries.reduce((acc, e) => acc + e.rating, 0)
    return Number((sum / allEntries.length).toFixed(1))
  }

  return {
    ratings,
    loadRatings,
    getAverageRating,
    getRatingCount,
    getUserRating,
    getUserRatings,
    submitRating,
    getOverallAverage,
  }
})
