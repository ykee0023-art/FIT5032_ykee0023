// Builds an iCalendar (.ics, RFC 5545) attachment for a GreenRoots event.

const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi

function to24Hour(hours, meridiem) {
  const h = Number(hours) % 12
  return meridiem.toUpperCase() === 'PM' ? h + 12 : h
}

// Melbourne wall-clock time to UTC, using the real offset for that date so daylight saving is handled
function melbourneToUtc(date, hours, minutes) {
  const [year, month, day] = date.split('-').map(Number)
  const guess = Date.UTC(year, month - 1, day, hours, minutes)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Melbourne',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(new Date(guess))
      .map((p) => [p.type, p.value]),
  )
  const guessInMelbourne = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  )
  return new Date(guess - (guessInMelbourne - guess))
}

// "9:00 AM - 12:00 PM" on "2026-10-24" -> start and end as UTC dates
export function eventTimes(date, time) {
  const matches = [...time.matchAll(TIME_PATTERN)]
  if (matches.length < 2) throw new Error(`Cannot read event time "${time}"`)
  const [start, end] = matches.map(([, h, m, meridiem]) =>
    melbourneToUtc(date, to24Hour(h, meridiem), Number(m)),
  )
  return { start, end }
}

function icsDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

function icsText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// Lines longer than 75 characters must be folded with CRLF followed by a space
function fold(line) {
  const parts = []
  for (let i = 0; i < line.length; i += 74) parts.push(line.slice(i, i + 74))
  return parts.join('\r\n ')
}

export function buildEventIcs(event, registrationId) {
  const { start, end } = eventTimes(event.date, event.time)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GreenRoots Melbourne//Volunteer Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${registrationId}@greenroots-melbourne`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(event.name)}`,
    `LOCATION:${icsText(`${event.location}, ${event.suburb} VIC`)}`,
    `DESCRIPTION:${icsText(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
