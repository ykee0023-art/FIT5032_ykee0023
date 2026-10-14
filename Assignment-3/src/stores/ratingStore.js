import { defineStore } from 'pinia'
import { ref } from 'vue'
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/init'

// Ratings live in Firestore so everyone sees the same averages. One document per user per event
// (ratings/{eventId}_{uid}), so rating again replaces the old score instead of adding a new one.
export const useRatingStore = defineStore('ratings', () => {
  // { [eventId]: [{ userId, rating }] }
  const ratings = ref({})
  // { eventId, message } for the rating that failed to save, so only that card shows it
  const saveError = ref(null)

  async function loadRatings() {
    try {
      const snapshot = await getDocs(collection(db, 'ratings'))
      const grouped = {}
      for (const d of snapshot.docs) {
        const { eventId, userId, rating } = d.data()
        ;(grouped[eventId] ??= []).push({ userId, rating })
      }
      ratings.value = grouped
    } catch {
      // Ratings are optional extras: the cards fall back to each event's seeded rating
    }
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

  function setLocalRating(eventId, userId, rating) {
    const entries = (ratings.value[eventId] ??= [])
    const existing = entries.findIndex((e) => e.userId === userId)
    if (rating === null) {
      if (existing >= 0) entries.splice(existing, 1)
    } else if (existing >= 0) {
      entries[existing] = { userId, rating }
    } else {
      entries.push({ userId, rating })
    }
  }

  // Shows the new score straight away, then saves it; puts the old score back if saving fails
  async function submitRating(eventId, userId, rating) {
    const previous = getUserRating(eventId, userId) || null
    saveError.value = null
    setLocalRating(eventId, userId, rating)
    try {
      await setDoc(doc(db, 'ratings', `${eventId}_${userId}`), {
        eventId,
        userId,
        rating,
        updatedAt: serverTimestamp(),
      })
    } catch {
      setLocalRating(eventId, userId, previous)
      saveError.value = { eventId, message: 'Your rating could not be saved. Please try again.' }
    }
  }

  function getOverallAverage() {
    const allEntries = Object.values(ratings.value).flat()
    if (allEntries.length === 0) return 0
    const sum = allEntries.reduce((acc, e) => acc + e.rating, 0)
    return Number((sum / allEntries.length).toFixed(1))
  }

  return {
    ratings,
    saveError,
    loadRatings,
    getAverageRating,
    getRatingCount,
    getUserRating,
    getUserRatings,
    submitRating,
    getOverallAverage,
  }
})
