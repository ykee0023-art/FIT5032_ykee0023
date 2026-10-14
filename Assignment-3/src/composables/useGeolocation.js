import { ref } from 'vue'

const FALLBACK = 'You can search for a suburb or park instead.'
const ERROR_MESSAGES = {
  1: `Location access is blocked. Allow it in your browser settings, or search for a suburb or park instead.`,
  2: `Your location could not be found right now. ${FALLBACK}`,
  3: `Finding your location took too long. Try again, or search for a suburb or park instead.`,
}

// Asks for the browser location only when called, i.e. after the user clicks a button
export function useGeolocation() {
  const locating = ref(false)
  const error = ref('')

  function locate() {
    error.value = ''
    if (!navigator.geolocation) {
      error.value = `Your browser does not support location. ${FALLBACK}`
      return Promise.resolve(null)
    }
    if (!window.isSecureContext) {
      error.value = `Location only works over a secure (https) connection. ${FALLBACK}`
      return Promise.resolve(null)
    }

    locating.value = true
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          locating.value = false
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude })
        },
        (positionError) => {
          locating.value = false
          error.value = ERROR_MESSAGES[positionError.code] ?? ERROR_MESSAGES[2]
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
      )
    })
  }

  return { locating, error, locate }
}
