// Cloud Functions (2nd gen) for GreenRoots Melbourne.
// Everything runs in australia-southeast2, the region of the Firestore database:
// Firestore triggers must be in the same region, and it keeps callables close to Melbourne users.
import { Buffer } from 'node:buffer'
import { setGlobalOptions } from 'firebase-functions'
import { HttpsError, onCall, onRequest } from 'firebase-functions/https'
import { onDocumentCreated } from 'firebase-functions/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import * as logger from 'firebase-functions/logger'
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { handleApiRequest } from './api.js'
import { buildEventIcs } from './calendar.js'

setGlobalOptions({ region: 'australia-southeast2', maxInstances: 5 })
initializeApp()
const db = getFirestore()

// The Brevo key lives in Secret Manager and is only exposed to functions that declare it
const BREVO_API_KEY = defineSecret('BREVO_API_KEY')
// The verified Brevo sender, set in functions/.env
const SENDER_EMAIL = defineString('SENDER_EMAIL')
const SENDER_NAME = 'GreenRoots Melbourne'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const HOURLY_LIMIT = 5
const BULK_LIMIT = 50
// Brevo is called a few at a time so a large batch does not trip its rate limit
const BULK_CONCURRENCY = 5

// Allowed attachments, checked by extension and by the file's first bytes (not just the name)
const ATTACHMENT_SIGNATURES = {
  pdf: (bytes) => bytes.subarray(0, 4).toString('latin1') === '%PDF',
  png: (bytes) => bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  jpg: (bytes) => bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  jpeg: (bytes) => bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  ics: (bytes) => bytes.subarray(0, 15).toString('utf8') === 'BEGIN:VCALENDAR',
}

function invalid(message) {
  return new HttpsError('invalid-argument', message)
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function textToHtml(text) {
  return escapeHtml(text)
    .split(/\r?\n\r?\n/)
    .map((paragraph) => `<p>${paragraph.replace(/\r?\n/g, '<br>')}</p>`)
    .join('')
}

function validateAttachment(attachment) {
  const name = typeof attachment?.name === 'string' ? attachment.name.trim() : ''
  const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  if (!name || name.length > 100 || !ATTACHMENT_SIGNATURES[extension]) {
    throw invalid('Attachments must be a PDF, PNG, JPG or ICS file.')
  }
  if (
    typeof attachment.content !== 'string' ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(attachment.content)
  ) {
    throw invalid('The attachment could not be read. Please choose the file again.')
  }
  const bytes = Buffer.from(attachment.content, 'base64')
  if (bytes.length === 0 || bytes.length > MAX_ATTACHMENT_BYTES) {
    throw invalid('Attachments must be smaller than 2 MB.')
  }
  if (!ATTACHMENT_SIGNATURES[extension](bytes)) {
    throw invalid(`The file does not look like a real .${extension} file.`)
  }
  return { name, content: attachment.content }
}

// Shared by the single and bulk email functions
function validateContent(subject, message) {
  // A line break in the subject could be used to inject extra email headers
  if (
    typeof subject !== 'string' ||
    !subject.trim() ||
    subject.length > 150 ||
    /[\r\n]/.test(subject)
  ) {
    throw invalid('The subject must be 1 to 150 characters on a single line.')
  }
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 5000) {
    throw invalid('The message must be between 10 and 5000 characters.')
  }
}

async function sendViaBrevo({ to, subject, text, replyTo, attachments = [] }) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY.value(),
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL.value() },
      to: [{ email: to }],
      ...(replyTo ? { replyTo } : {}),
      subject,
      textContent: text,
      htmlContent: textToHtml(text),
      ...(attachments.length ? { attachment: attachments } : {}),
    }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`Brevo responded ${response.status}: ${body.message || 'unknown error'}`)
  }
  return body.messageId
}

function logEmail(entry) {
  return db.collection('emailLogs').add({ ...entry, createdAt: FieldValue.serverTimestamp() })
}

// D.2: a signed-in user sends one email (optionally with an attachment) from the compose page
export const sendEmail = onCall({ secrets: [BREVO_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please sign in to send emails.')
  }

  const { to, subject, message, attachment } = request.data || {}
  const recipient = typeof to === 'string' ? to.trim() : ''
  if (!EMAIL_PATTERN.test(recipient) || recipient.length > 254) {
    throw invalid('Please enter a valid recipient email address.')
  }
  validateContent(subject, message)
  const attachments = attachment ? [validateAttachment(attachment)] : []

  const uid = request.auth.uid
  const profile = await db.doc(`users/${uid}`).get()
  // Volunteers are rate limited so the form cannot be used to send spam; admins are trusted
  if (profile.get('role') !== 'admin') {
    const since = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000)
    const recent = await db
      .collection('emailLogs')
      .where('sentBy', '==', uid)
      .where('createdAt', '>=', since)
      .count()
      .get()
    if (recent.data().count >= HOURLY_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        `You can send up to ${HOURLY_LIMIT} emails per hour. Please try again later.`,
      )
    }
  }

  const senderName = profile.get('name') || 'A GreenRoots volunteer'
  const log = {
    to: recipient,
    subject: subject.trim(),
    type: 'single',
    sentBy: uid,
    attachmentName: attachments[0]?.name ?? null,
  }
  try {
    const messageId = await sendViaBrevo({
      to: recipient,
      subject: subject.trim(),
      text: `${message.trim()}\n\nSent by ${senderName} via GreenRoots Melbourne.`,
      // Replies go to the person who wrote the email, not to the GreenRoots sender address
      replyTo: request.auth.token.email
        ? { email: request.auth.token.email, name: senderName }
        : null,
      attachments,
    })
    await logEmail({ ...log, status: 'sent' })
    logger.info('sendEmail sent', { uid, messageId })
    return { messageId }
  } catch (error) {
    logger.error('sendEmail failed', { uid, error: error.message })
    await logEmail({ ...log, status: 'failed' })
    throw new HttpsError(
      'unavailable',
      'The email service is unavailable right now. Please try again shortly.',
    )
  }
})

// F.1 Bulk Email: an admin emails the volunteers selected in the registrations table.
// The client sends registration IDs, not addresses, so the function only ever emails people
// who registered on this site, and each person gets their own copy (no shared To/CC list).
export const sendBulkEmail = onCall(
  { secrets: [BREVO_API_KEY], timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Please sign in to send emails.')
    }
    const uid = request.auth.uid
    const profile = await db.doc(`users/${uid}`).get()
    if (profile.get('role') !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can send bulk emails.')
    }

    const { registrationIds, subject, message, attachment } = request.data || {}
    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      throw invalid('Select at least one volunteer to email.')
    }
    const ids = [...new Set(registrationIds)]
    if (ids.length > BULK_LIMIT) {
      throw invalid(`You can email up to ${BULK_LIMIT} volunteers at a time.`)
    }
    if (!ids.every((id) => typeof id === 'string' && /^[\w-]{1,100}$/.test(id))) {
      throw invalid('The selection could not be read. Please select the volunteers again.')
    }
    validateContent(subject, message)
    const attachments = attachment ? [validateAttachment(attachment)] : []

    const snapshots = await db.getAll(...ids.map((id) => db.doc(`registrations/${id}`)))
    const results = []
    const recipients = []
    const seen = new Set()
    for (const snapshot of snapshots) {
      const data = snapshot.data() ?? {}
      const email = String(data.email ?? '').trim().toLowerCase()
      const entry = { id: snapshot.id, name: data.name ?? '', email }
      let reason = ''
      if (!snapshot.exists) reason = 'Registration not found'
      // Seeded Mockaroo rows use made-up addresses on real domains, so they are never emailed
      else if (data.source !== 'website') reason = 'Sample data, not a real mailbox'
      else if (!EMAIL_PATTERN.test(email)) reason = 'Invalid email address'
      else if (seen.has(email)) reason = 'Same email as another selected volunteer'

      if (reason) {
        results.push({ ...entry, status: 'skipped', reason })
      } else {
        seen.add(email)
        recipients.push({ ...entry, eventName: data.eventName || 'a GreenRoots event' })
      }
    }

    const batchId = db.collection('emailLogs').doc().id
    const cleanSubject = subject.trim()
    const replyTo = request.auth.token.email ? { email: request.auth.token.email } : null

    async function sendOne({ eventName, ...recipient }) {
      const firstName = recipient.name.trim().split(/\s+/)[0] || 'there'
      const body = message.trim().replaceAll('{name}', firstName).replaceAll('{event}', eventName)
      // Says why the person is getting the email and how to opt out (Spam Act 2003)
      const text =
        `${body}\n\n--\nYou are receiving this because you registered for ${eventName} ` +
        'with GreenRoots Melbourne. Reply to this email if you would rather not hear from us.'
      const log = {
        to: recipient.email,
        subject: cleanSubject,
        type: 'bulk',
        sentBy: uid,
        batchId,
        attachmentName: attachments[0]?.name ?? null,
      }
      try {
        await sendViaBrevo({ to: recipient.email, subject: cleanSubject, text, replyTo, attachments })
        await logEmail({ ...log, status: 'sent' })
        return { ...recipient, status: 'sent', reason: '' }
      } catch (error) {
        logger.error('Bulk email failed', {
          batchId,
          registrationId: recipient.id,
          error: error.message,
        })
        await logEmail({ ...log, status: 'failed' })
        return { ...recipient, status: 'failed', reason: 'The email service did not accept it' }
      }
    }

    for (let i = 0; i < recipients.length; i += BULK_CONCURRENCY) {
      const batch = recipients.slice(i, i + BULK_CONCURRENCY)
      results.push(...(await Promise.all(batch.map(sendOne))))
    }

    const total = (status) => results.filter((result) => result.status === status).length
    logger.info('sendBulkEmail finished', { uid, batchId, sent: total('sent') })
    return {
      batchId,
      sent: total('sent'),
      skipped: total('skipped'),
      failed: total('failed'),
      results,
    }
  },
)

// F.1 public REST API: GET /events, /events/{id} and /stats (routes live in api.js)
export const api = onRequest({ invoker: 'public' }, (req, res) =>
  handleApiRequest(req, res, db, logger),
)

// E.1: when a volunteer registers on the website, book a spot and email a confirmation
export const onRegistrationCreated = onDocumentCreated(
  { document: 'registrations/{registrationId}', secrets: [BREVO_API_KEY] },
  async (event) => {
    const snapshot = event.data
    // Seeded Mockaroo rows already have a status and use fake email addresses
    if (!snapshot || snapshot.get('source') !== 'website') return

    const registration = snapshot.data()
    const eventRef = db.doc(`events/${registration.eventId}`)

    // A transaction stops two volunteers from both taking the last spot.
    // processedAt makes the trigger safe to run twice (Firestore triggers are at-least-once).
    const booking = await db.runTransaction(async (tx) => {
      const [current, eventDoc] = await Promise.all([tx.get(snapshot.ref), tx.get(eventRef)])
      if (current.get('processedAt')) return null
      if (!eventDoc.exists) throw new Error(`Event ${registration.eventId} not found`)

      const details = eventDoc.data()
      const status = details.spots > 0 ? 'confirmed' : 'waitlist'
      if (status === 'confirmed') tx.update(eventRef, { spots: FieldValue.increment(-1) })
      tx.update(snapshot.ref, { status, processedAt: FieldValue.serverTimestamp() })
      return { status, details }
    })
    if (!booking) return

    const { status, details } = booking
    const when = new Date(`${details.date}T00:00:00`).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const confirmed = status === 'confirmed'
    const subject = confirmed ? `You're registered: ${details.name}` : `Waitlist: ${details.name}`
    const text = confirmed
      ? `Hi ${registration.name},\n\nThanks for registering for ${details.name}.\n\n` +
        `When: ${when}, ${details.time}\nWhere: ${details.location}, ${details.suburb}\n\n` +
        'The attached calendar file adds the event to your calendar. We will see you there!\n\nGreenRoots Melbourne'
      : `Hi ${registration.name},\n\n${details.name} on ${when} is currently full, so we have added you ` +
        'to the waitlist. We will email you if a spot opens up.\n\nGreenRoots Melbourne'
    const attachments = confirmed
      ? [
          {
            name: 'greenroots-event.ics',
            content: Buffer.from(buildEventIcs(details, snapshot.id)).toString('base64'),
          },
        ]
      : []

    const log = { to: registration.email, subject, type: 'confirmation', sentBy: registration.uid }
    try {
      await sendViaBrevo({ to: registration.email, subject, text, attachments })
      await logEmail({ ...log, status: 'sent', attachmentName: attachments[0]?.name ?? null })
    } catch (error) {
      // The booking itself succeeded, so a failed email is logged rather than retried
      logger.error('Confirmation email failed', {
        registrationId: snapshot.id,
        error: error.message,
      })
      await logEmail({ ...log, status: 'failed', attachmentName: null })
    }
  },
)
