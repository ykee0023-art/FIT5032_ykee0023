<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/init'
import { useAuthStore } from '@/stores/authStore'
import { useEventStore } from '@/stores/eventStore'
import { useFormValidation } from '@/composables/useFormValidation'
import { sanitizeInput } from '@/utils/security'

const route = useRoute()
const authStore = useAuthStore()
const eventStore = useEventStore()

const { form, errors, validateField, validateAll, resetForm } = useFormValidation(
  ['eventId', 'name', 'email', 'phone', 'age', 'skills', 'message'],
  {
    eventId: { type: 'required', label: 'Event' },
    name: { type: 'required', label: 'Name' },
    email: { type: 'email', label: 'Email' },
    phone: { type: 'phone', label: 'Phone' },
    age: { type: 'ageRange', label: 'Age', min: 16, max: 100 },
    skills: { type: 'required', label: 'Area of interest' },
    message: { type: 'minLength', label: 'Message', min: 5 },
  },
)

const submitted = ref(false)
const submitting = ref(false)
const submitError = ref('')
const confirmation = ref('')

const selectedEvent = computed(() => eventStore.events.find((e) => e.id === form.eventId))

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// Same age bands as the Mockaroo seed data, so the admin table and charts can group them
function ageGroupFor(age) {
  if (age < 18) return 'Under 18'
  if (age < 25) return '18-24'
  if (age < 35) return '25-34'
  if (age < 45) return '35-44'
  if (age < 55) return '45-54'
  if (age < 65) return '55-64'
  return '65+'
}

function prefillUser() {
  form.name = authStore.currentUser?.name || ''
  form.email = authStore.currentUser?.email || ''
}

onMounted(async () => {
  prefillUser()
  await eventStore.loadEvents()
  // ?event=ID comes from the Register buttons on the events page
  const requested = Number(route.query.event)
  if (eventStore.events.some((e) => e.id === requested)) {
    form.eventId = requested
  }
})

async function handleSubmit() {
  submitted.value = true
  submitError.value = ''
  if (!validateAll() || submitting.value) return

  const event = selectedEvent.value
  const hasSpot = event.spots > 0
  submitting.value = true
  try {
    await addDoc(collection(db, 'registrations'), {
      uid: authStore.currentUser.id,
      name: sanitizeInput(form.name),
      email: sanitizeInput(form.email),
      phone: sanitizeInput(form.phone),
      eventId: event.id,
      eventName: event.name,
      suburb: event.suburb,
      age: form.age,
      ageGroup: ageGroupFor(form.age),
      interest: sanitizeInput(form.skills),
      message: sanitizeInput(form.message),
      status: hasSpot ? 'confirmed' : 'waitlist',
      source: 'website',
      createdAt: serverTimestamp(),
    })

    confirmation.value = hasSpot
      ? `You're registered for ${event.name} on ${formatDate(event.date)}. See you there!`
      : `${event.name} is full, so we've added you to the waitlist and will contact you if a spot opens up.`
    resetForm()
    prefillUser()
    submitted.value = false
  } catch {
    submitError.value = 'Sorry, we could not save your registration. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container py-5">
    <div class="row g-4 g-lg-5">
      <div class="col-12 col-lg-5">
        <h1 class="mb-3">Get Involved</h1>
        <p class="lead">
          Join GreenRoots Melbourne as a volunteer and help us plant a greener future for our city.
        </p>
        <div class="mt-4">
          <div class="d-flex align-items-start mb-3">
            <i class="bi bi-clock fs-4 text-greenroots me-3" aria-hidden="true"></i>
            <div>
              <h2 class="h6 mb-1">Flexible Hours</h2>
              <p class="small text-muted mb-0">
                Choose events that fit your schedule — weekdays, weekends, or school holidays.
              </p>
            </div>
          </div>
          <div class="d-flex align-items-start mb-3">
            <i class="bi bi-tools fs-4 text-greenroots me-3" aria-hidden="true"></i>
            <div>
              <h2 class="h6 mb-1">No Experience Needed</h2>
              <p class="small text-muted mb-0">
                We provide all training, tools, and protective equipment.
              </p>
            </div>
          </div>
          <div class="d-flex align-items-start mb-3">
            <i class="bi bi-award fs-4 text-greenroots me-3" aria-hidden="true"></i>
            <div>
              <h2 class="h6 mb-1">Certificate of Participation</h2>
              <p class="small text-muted mb-0">
                Receive recognition for your contribution to the community.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-7">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h2 class="h4 card-title mb-3">Volunteer Registration</h2>

            <div v-if="confirmation" class="alert alert-success alert-dismissible" role="alert">
              {{ confirmation }}
              <button
                type="button"
                class="btn-close"
                aria-label="Dismiss confirmation message"
                @click="confirmation = ''"
              ></button>
            </div>
            <div v-if="submitError" class="alert alert-danger" role="alert">{{ submitError }}</div>
            <div v-if="eventStore.loadError" class="alert alert-danger" role="alert">
              {{ eventStore.loadError }}
            </div>

            <form @submit.prevent="handleSubmit" novalidate>
              <div class="row g-3">
                <div class="col-12">
                  <label for="vol-event" class="form-label">
                    Event <span class="text-danger">*</span>
                  </label>
                  <select
                    id="vol-event"
                    v-model.number="form.eventId"
                    class="form-select"
                    :class="{
                      'is-invalid': errors.eventId,
                      'is-valid': submitted && !errors.eventId && form.eventId,
                    }"
                    :disabled="eventStore.loading && eventStore.events.length === 0"
                    @blur="validateField('eventId')"
                    :aria-invalid="errors.eventId ? 'true' : undefined"
                    :aria-describedby="errors.eventId ? 'vol-event-error' : undefined"
                  >
                    <option value="" disabled>
                      {{ eventStore.loading ? 'Loading events...' : 'Select an event' }}
                    </option>
                    <option v-for="event in eventStore.events" :key="event.id" :value="event.id">
                      {{ event.name }} ({{ formatDate(event.date) }}) &ndash;
                      {{ event.spots > 0 ? `${event.spots} spots left` : 'full, join waitlist' }}
                    </option>
                  </select>
                  <div id="vol-event-error" class="invalid-feedback">{{ errors.eventId }}</div>
                  <div v-if="selectedEvent" class="form-text">
                    {{ selectedEvent.time }} at {{ selectedEvent.location }},
                    {{ selectedEvent.suburb }}
                  </div>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="vol-name" class="form-label">
                    Full Name <span class="text-danger">*</span>
                  </label>
                  <input
                    id="vol-name"
                    v-model="form.name"
                    type="text"
                    autocomplete="name"
                    class="form-control"
                    :class="{
                      'is-invalid': errors.name,
                      'is-valid': submitted && !errors.name && form.name,
                    }"
                    placeholder="Your full name"
                    @blur="validateField('name')"
                    :aria-invalid="errors.name ? 'true' : undefined"
                    :aria-describedby="errors.name ? 'vol-name-error' : undefined"
                  />
                  <div id="vol-name-error" class="invalid-feedback">{{ errors.name }}</div>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="vol-email" class="form-label">
                    Email <span class="text-danger">*</span>
                  </label>
                  <input
                    id="vol-email"
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    class="form-control"
                    :class="{
                      'is-invalid': errors.email,
                      'is-valid': submitted && !errors.email && form.email,
                    }"
                    placeholder="your.email@example.com"
                    @blur="validateField('email')"
                    :aria-invalid="errors.email ? 'true' : undefined"
                    :aria-describedby="errors.email ? 'vol-email-error' : undefined"
                  />
                  <div id="vol-email-error" class="invalid-feedback">{{ errors.email }}</div>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="vol-phone" class="form-label">
                    Phone <span class="text-danger">*</span>
                  </label>
                  <input
                    id="vol-phone"
                    v-model="form.phone"
                    type="tel"
                    autocomplete="tel"
                    class="form-control"
                    :class="{
                      'is-invalid': errors.phone,
                      'is-valid': submitted && !errors.phone && form.phone,
                    }"
                    placeholder="0412 345 678"
                    @blur="validateField('phone')"
                    :aria-invalid="errors.phone ? 'true' : undefined"
                    :aria-describedby="errors.phone ? 'vol-phone-error' : undefined"
                  />
                  <div id="vol-phone-error" class="invalid-feedback">{{ errors.phone }}</div>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="vol-age" class="form-label">
                    Age <span class="text-danger">*</span>
                  </label>
                  <input
                    id="vol-age"
                    v-model.number="form.age"
                    type="number"
                    class="form-control"
                    :class="{
                      'is-invalid': errors.age,
                      'is-valid': submitted && !errors.age && form.age,
                    }"
                    placeholder="Must be 16-100"
                    @blur="validateField('age')"
                    :aria-invalid="errors.age ? 'true' : undefined"
                    :aria-describedby="errors.age ? 'vol-age-error' : undefined"
                  />
                  <div id="vol-age-error" class="invalid-feedback">{{ errors.age }}</div>
                </div>

                <div class="col-12">
                  <label for="vol-skills" class="form-label">
                    Area of Interest <span class="text-danger">*</span>
                  </label>
                  <select
                    id="vol-skills"
                    v-model="form.skills"
                    class="form-select"
                    :class="{
                      'is-invalid': errors.skills,
                      'is-valid': submitted && !errors.skills && form.skills,
                    }"
                    @blur="validateField('skills')"
                    :aria-invalid="errors.skills ? 'true' : undefined"
                    :aria-describedby="errors.skills ? 'vol-skills-error' : undefined"
                  >
                    <option value="" disabled>Select your interest</option>
                    <option value="planting">Tree Planting</option>
                    <option value="gardening">Community Gardening</option>
                    <option value="education">Education & Workshops</option>
                    <option value="conservation">Habitat Conservation</option>
                    <option value="admin">Admin & Coordination</option>
                  </select>
                  <div id="vol-skills-error" class="invalid-feedback">{{ errors.skills }}</div>
                </div>

                <div class="col-12">
                  <label for="vol-message" class="form-label">
                    Why do you want to volunteer? <span class="text-danger">*</span>
                  </label>
                  <textarea
                    id="vol-message"
                    v-model="form.message"
                    class="form-control"
                    :class="{
                      'is-invalid': errors.message,
                      'is-valid': submitted && !errors.message && form.message,
                    }"
                    rows="3"
                    placeholder="Tell us about yourself (at least 5 characters)"
                    @blur="validateField('message')"
                    :aria-invalid="errors.message ? 'true' : undefined"
                    :aria-describedby="errors.message ? 'vol-message-error' : undefined"
                  ></textarea>
                  <div id="vol-message-error" class="invalid-feedback">{{ errors.message }}</div>
                </div>

                <div class="col-12">
                  <button
                    type="submit"
                    class="btn btn-greenroots w-100"
                    :disabled="submitting"
                  >
                    <span
                      v-if="submitting"
                      class="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    ></span>
                    <i v-else class="bi bi-person-plus me-2" aria-hidden="true"></i>
                    {{ submitting ? 'Registering...' : 'Register as Volunteer' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
