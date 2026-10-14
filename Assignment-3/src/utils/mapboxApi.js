// Mapbox REST APIs used by the map page. The token is a public (pk.) token that only
// works from this site's URLs, as set in the Mapbox dashboard.
const API_BASE = 'https://api.mapbox.com'
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
// Every event is in Greater Melbourne, so rank places near the CBD first
const MELBOURNE_PROXIMITY = '144.9631,-37.8136'

async function getJson(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Mapbox request failed with status ${response.status}`)
  return response.json()
}

// Search Box bills suggest + retrieve calls with the same session token as one search
export function newSearchSession() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function suggestPlaces(query, sessionToken, signal) {
  const params = new URLSearchParams({
    q: query,
    access_token: MAPBOX_TOKEN,
    session_token: sessionToken,
    country: 'au',
    proximity: MELBOURNE_PROXIMITY,
    language: 'en',
    limit: '6',
    types: 'poi,address,street,neighborhood,locality,place,postcode',
  })
  const data = await getJson(`${API_BASE}/search/searchbox/v1/suggest?${params}`, signal)
  return (data.suggestions ?? []).map((suggestion) => ({
    id: suggestion.mapbox_id,
    name: suggestion.name,
    detail: suggestion.full_address || suggestion.place_formatted || '',
  }))
}

export async function retrievePlace(id, sessionToken) {
  const params = new URLSearchParams({ access_token: MAPBOX_TOKEN, session_token: sessionToken })
  const data = await getJson(
    `${API_BASE}/search/searchbox/v1/retrieve/${encodeURIComponent(id)}?${params}`,
  )
  const feature = data.features?.[0]
  if (!feature) throw new Error('Place not found')

  const [lng, lat] = feature.geometry.coordinates
  return {
    name: feature.properties.name,
    detail: feature.properties.full_address || feature.properties.place_formatted || '',
    lng,
    lat,
  }
}
