// F.1 public REST API (read-only). Served at https://fit5032-1b795.web.app/api/... through a
// Hosting rewrite, and also directly at the Cloud Functions URL. Only event data and totals are
// returned; no names, emails or other personal details ever leave this API.
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function toPublicEvent(data) {
  return {
    id: data.id,
    name: data.name,
    date: data.date,
    time: data.time,
    type: data.type,
    location: data.location,
    suburb: data.suburb,
    coordinates: { lat: data.lat, lng: data.lng },
    totalSpots: data.totalSpots,
    spotsLeft: data.spots,
    rating: data.rating,
    description: data.description,
  }
}

function readText(query, name, maxLength) {
  const value = query[name]
  if (value === undefined) return ''
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new ApiError(400, `"${name}" must be a single value of up to ${maxLength} characters.`)
  }
  return value.trim()
}

function readLimit(query) {
  if (query.limit === undefined) return DEFAULT_LIMIT
  const limit = Number(query.limit)
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ApiError(400, `"limit" must be a whole number from 1 to ${MAX_LIMIT}.`)
  }
  return limit
}

async function allEvents(db) {
  // 24 documents: filtering in memory avoids a composite index for every filter combination
  const snapshot = await db.collection('events').get()
  return snapshot.docs.map((doc) => doc.data()).sort((a, b) => a.date.localeCompare(b.date))
}

async function listEvents(db, query) {
  const type = readText(query, 'type', 50).toLowerCase()
  const suburb = readText(query, 'suburb', 50).toLowerCase()
  const from = readText(query, 'from', 10)
  if (from && !(DATE_PATTERN.test(from) && !Number.isNaN(Date.parse(from)))) {
    throw new ApiError(400, '"from" must be a date in YYYY-MM-DD format.')
  }
  const limit = readLimit(query)

  const matches = (await allEvents(db)).filter(
    (event) =>
      (!type || event.type.toLowerCase() === type) &&
      (!suburb || event.suburb.toLowerCase() === suburb) &&
      (!from || event.date >= from),
  )
  return {
    data: matches.slice(0, limit).map(toPublicEvent),
    meta: { total: matches.length, returned: Math.min(limit, matches.length), limit },
  }
}

async function getEvent(db, id) {
  if (!/^\d{1,6}$/.test(id)) throw new ApiError(400, 'Event IDs are whole numbers, e.g. /events/3.')
  const doc = await db.doc(`events/${id}`).get()
  if (!doc.exists) throw new ApiError(404, `There is no event with ID ${id}.`)
  return { data: toPublicEvent(doc.data()) }
}

async function getStats(db) {
  const [events, registrations, confirmed] = await Promise.all([
    allEvents(db),
    db.collection('registrations').count().get(),
    db.collection('registrations').where('status', '==', 'confirmed').count().get(),
  ])
  const today = new Date().toISOString().slice(0, 10)
  const byType = new Map()
  for (const event of events) {
    const row = byType.get(event.type) ?? {
      type: event.type,
      events: 0,
      totalSpots: 0,
      spotsFilled: 0,
    }
    row.events += 1
    row.totalSpots += event.totalSpots
    row.spotsFilled += event.totalSpots - event.spots
    byType.set(event.type, row)
  }
  const totalSpots = events.reduce((sum, event) => sum + event.totalSpots, 0)
  const spotsLeft = events.reduce((sum, event) => sum + event.spots, 0)

  return {
    data: {
      events: events.length,
      upcomingEvents: events.filter((event) => event.date >= today).length,
      suburbs: new Set(events.map((event) => event.suburb)).size,
      totalSpots,
      spotsFilled: totalSpots - spotsLeft,
      registrations: registrations.data().count,
      confirmedVolunteers: confirmed.data().count,
      byType: [...byType.values()].sort((a, b) => b.spotsFilled - a.spotsFilled),
    },
    meta: { generatedAt: new Date().toISOString() },
  }
}

const ROUTES = [
  {
    pattern: /^\/?$/,
    handler: () => ({
      data: {
        name: 'GreenRoots Melbourne API',
        version: 1,
        routes: ['GET /events', 'GET /events/{id}', 'GET /stats'],
        docs: 'https://fit5032-1b795.web.app/developers',
      },
    }),
  },
  { pattern: /^\/events$/, handler: (db, req) => listEvents(db, req.query) },
  { pattern: /^\/events\/([^/]+)$/, handler: (db, req, [id]) => getEvent(db, id) },
  { pattern: /^\/stats$/, handler: (db) => getStats(db) },
]

export async function handleApiRequest(req, res, db, logger) {
  // A public, read-only API that sends no cookies, so any website may call it
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('X-Content-Type-Options', 'nosniff')

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Max-Age', '3600').status(204).send('')
    return
  }

  // Requests through Hosting arrive as /api/events, direct ones as /events
  const path = req.path.replace(/^\/api(?=\/|$)/, '').replace(/\/+$/, '')
  const route = ROUTES.find(({ pattern }) => pattern.test(path))
  try {
    if (!route) throw new ApiError(404, `No route matches ${path || '/'}. See GET / for the list.`)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.set('Allow', 'GET, OPTIONS')
      throw new ApiError(405, `${req.method} is not allowed. This API is read-only.`)
    }
    const params = path.match(route.pattern).slice(1)
    const body = await route.handler(db, req, params)
    res.set('Cache-Control', 'public, max-age=60').status(200).json(body)
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500
    if (status === 500) logger.error('API request failed', { path, error: error.message })
    res
      .set('Cache-Control', 'no-store')
      .status(status)
      .json({
        error: {
          status,
          message:
            status === 500 ? 'Something went wrong on our side. Please try again.' : error.message,
        },
      })
  }
}
