const EARTH_RADIUS_KM = 6371

const toRadians = (degrees) => (degrees * Math.PI) / 180
const toDegrees = (radians) => (radians * 180) / Math.PI

// Great-circle distance between two { lat, lng } points (haversine formula)
export function haversineKm(from, to) {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

// GeoJSON polygon approximating a circle of radiusKm around center, used to draw the search radius
export function circlePolygon(center, radiusKm, steps = 64) {
  const lat1 = toRadians(center.lat)
  const lng1 = toRadians(center.lng)
  const angular = radiusKm / EARTH_RADIUS_KM
  const ring = []

  for (let i = 0; i <= steps; i++) {
    const bearing = (2 * Math.PI * i) / steps
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
    )
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
      )
    ring.push([toDegrees(lng2), toDegrees(lat2)])
  }

  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }
}
