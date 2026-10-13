// One-off import of the seed data into Firestore. Run from the Assignment-3 folder:
//   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... node seed/seed-firestore.mjs
// It signs in as an admin account, so every write still goes through the Firestore security rules.
// Re-running is safe: documents have fixed IDs and are overwritten, not duplicated.
// Set SEED_USE_EMULATORS=true to write to the local emulators instead of the live project.
import fs from 'node:fs'
import process from 'node:process'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { connectFirestoreEmulator, doc, getFirestore, setDoc, Timestamp } from 'firebase/firestore'

const readJson = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'))

// Same Firebase web config the app reads from .env.local
const env = Object.fromEntries(
  fs
    .readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('='))
    .map((line) => [
      line.slice(0, line.indexOf('=')).trim(),
      line.slice(line.indexOf('=') + 1).trim(),
    ]),
)

const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_USE_EMULATORS } = process.env
if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to an admin account first.')
  process.exit(1)
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)
if (SEED_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

const events = readJson('./events.json')
const registrations = readJson('./registrations.mockaroo.json')
const eventsById = new Map(events.map((e) => [e.id, e]))

for (const r of registrations) {
  if (!eventsById.has(r.eventId)) throw new Error(`Registration for unknown event ${r.eventId}`)
}

// Remaining spots = capacity minus confirmed registrations, so the cards, tables and map agree
const confirmed = new Map()
for (const r of registrations) {
  if (r.status === 'confirmed') confirmed.set(r.eventId, (confirmed.get(r.eventId) || 0) + 1)
}

await signInWithEmailAndPassword(auth, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD)

for (const event of events) {
  await setDoc(doc(db, 'events', String(event.id)), {
    ...event,
    spots: Math.max(event.totalSpots - (confirmed.get(event.id) || 0), 0),
  })
}
console.log(`events: ${events.length} written`)

for (const [i, r] of registrations.entries()) {
  const event = eventsById.get(r.eventId)
  await setDoc(doc(db, 'registrations', `mock-${String(i + 1).padStart(3, '0')}`), {
    uid: null,
    name: r.name,
    email: r.email,
    phone: r.phone,
    eventId: event.id,
    eventName: event.name,
    suburb: event.suburb,
    ageGroup: r.ageGroup,
    status: r.status,
    createdAt: Timestamp.fromDate(new Date(r.createdAt)),
    // Mockaroo email addresses are fake, so bulk email must skip these
    source: 'mockaroo',
  })
}
console.log(`registrations: ${registrations.length} written`)

await signOut(auth)
process.exit(0)
