<script setup>
import { ref } from 'vue'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/init'
import { useFormValidation } from '@/composables/useFormValidation'
import { sanitizeInput } from '@/utils/security'

const { form, errors, validateField, validateAll, resetForm } = useFormValidation(
  ['name', 'email', 'subject', 'message'],
  {
    name: { type: 'required', label: 'Name' },
    email: { type: 'email', label: 'Email' },
    subject: { type: 'required', label: 'Subject' },
    message: { type: 'minLength', label: 'Message', min: 10 },
  },
)

const submitted = ref(false)
const submitSuccess = ref(false)
const submitting = ref(false)
const submitError = ref('')

async function handleSubmit() {
  submitted.value = true
  submitError.value = ''
  if (!validateAll() || submitting.value) return

  submitting.value = true
  try {
    // Firestore rules accept exactly these fields, with length limits matching the maxlength attributes
    await addDoc(collection(db, 'messages'), {
      name: sanitizeInput(form.name),
      email: sanitizeInput(form.email),
      subject: sanitizeInput(form.subject),
      message: sanitizeInput(form.message),
      createdAt: serverTimestamp(),
    })

    submitSuccess.value = true
    resetForm()
    submitted.value = false
  } catch {
    submitError.value = 'Sorry, we could not send your message. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <h1 class="mb-2">Contact Us</h1>
        <p class="text-muted mb-4">
          Have a question about our programs? We'd love to hear from you.
        </p>

        <div v-if="submitSuccess" class="alert alert-success alert-dismissible" role="alert">
          Thank you for your message! We will get back to you soon.
          <button
            type="button"
            class="btn-close"
            aria-label="Dismiss confirmation message"
            @click="submitSuccess = false"
          ></button>
        </div>
        <div v-if="submitError" class="alert alert-danger" role="alert">{{ submitError }}</div>

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="mb-3">
            <label for="name" class="form-label">
              Full Name <span class="text-danger">*</span>
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              maxlength="100"
              class="form-control"
              :class="{
                'is-invalid': errors.name,
                'is-valid': submitted && !errors.name && form.name,
              }"
              placeholder="Enter your full name"
              @blur="validateField('name')"
              :aria-invalid="errors.name ? 'true' : undefined"
              :aria-describedby="errors.name ? 'name-error' : undefined"
            />
            <div id="name-error" class="invalid-feedback">{{ errors.name }}</div>
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">
              Email Address <span class="text-danger">*</span>
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              maxlength="254"
              class="form-control"
              :class="{
                'is-invalid': errors.email,
                'is-valid': submitted && !errors.email && form.email,
              }"
              placeholder="your.email@example.com"
              @blur="validateField('email')"
              :aria-invalid="errors.email ? 'true' : undefined"
              :aria-describedby="errors.email ? 'email-error' : undefined"
            />
            <div id="email-error" class="invalid-feedback">{{ errors.email }}</div>
          </div>

          <div class="mb-3">
            <label for="subject" class="form-label">
              Subject <span class="text-danger">*</span>
            </label>
            <select
              id="subject"
              v-model="form.subject"
              class="form-select"
              :class="{
                'is-invalid': errors.subject,
                'is-valid': submitted && !errors.subject && form.subject,
              }"
              @blur="validateField('subject')"
              :aria-invalid="errors.subject ? 'true' : undefined"
              :aria-describedby="errors.subject ? 'subject-error' : undefined"
            >
              <option value="" disabled>Select a subject</option>
              <option value="volunteer">Volunteer Inquiry</option>
              <option value="donation">Donation Information</option>
              <option value="event">Event Question</option>
              <option value="partnership">Partnership Opportunity</option>
              <option value="other">Other</option>
            </select>
            <div id="subject-error" class="invalid-feedback">{{ errors.subject }}</div>
          </div>

          <div class="mb-3">
            <label for="message" class="form-label">
              Message <span class="text-danger">*</span>
            </label>
            <textarea
              id="message"
              v-model="form.message"
              maxlength="2000"
              class="form-control"
              :class="{
                'is-invalid': errors.message,
                'is-valid': submitted && !errors.message && form.message,
              }"
              rows="5"
              placeholder="Tell us how we can help (at least 10 characters)"
              @blur="validateField('message')"
              :aria-invalid="errors.message ? 'true' : undefined"
              :aria-describedby="errors.message ? 'message-error' : undefined"
            ></textarea>
            <div id="message-error" class="invalid-feedback">{{ errors.message }}</div>
            <div class="form-text">{{ form.message.length }} / 10 minimum characters</div>
          </div>

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
            <i v-else class="bi bi-send me-2" aria-hidden="true"></i>
            {{ submitting ? 'Sending...' : 'Send Message' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
