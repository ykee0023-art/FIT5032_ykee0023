<script setup>
import { ref } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'

const { form, errors, validateField, validateAll, isFormValid, resetForm } = useFormValidation(
  ['name', 'email', 'subject', 'message'],
  {
    name: { type: 'required', label: 'Name' },
    email: { type: 'email', label: 'Email' },
    subject: { type: 'required', label: 'Subject' },
    message: { type: 'minLength', label: 'Message', min: 10 }
  }
)

const submitted = ref(false)
const submitSuccess = ref(false)

function handleSubmit() {
  submitted.value = true
  if (validateAll()) {
    const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]')
    submissions.push({
      ...form,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('contactSubmissions', JSON.stringify(submissions))

    submitSuccess.value = true
    resetForm()
    submitted.value = false
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

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="mb-3">
            <label for="name" class="form-label">
              Full Name <span class="text-danger">*</span>
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-control"
              :class="{
                'is-invalid': errors.name,
                'is-valid': submitted && !errors.name && form.name
              }"
              placeholder="Enter your full name"
              @blur="validateField('name')"
            />
            <div class="invalid-feedback">{{ errors.name }}</div>
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">
              Email Address <span class="text-danger">*</span>
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-control"
              :class="{
                'is-invalid': errors.email,
                'is-valid': submitted && !errors.email && form.email
              }"
              placeholder="your.email@example.com"
              @blur="validateField('email')"
            />
            <div class="invalid-feedback">{{ errors.email }}</div>
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
                'is-valid': submitted && !errors.subject && form.subject
              }"
              @blur="validateField('subject')"
            >
              <option value="" disabled>Select a subject</option>
              <option value="volunteer">Volunteer Inquiry</option>
              <option value="donation">Donation Information</option>
              <option value="event">Event Question</option>
              <option value="partnership">Partnership Opportunity</option>
              <option value="other">Other</option>
            </select>
            <div class="invalid-feedback">{{ errors.subject }}</div>
          </div>

          <div class="mb-3">
            <label for="message" class="form-label">
              Message <span class="text-danger">*</span>
            </label>
            <textarea
              id="message"
              v-model="form.message"
              class="form-control"
              :class="{
                'is-invalid': errors.message,
                'is-valid': submitted && !errors.message && form.message
              }"
              rows="5"
              placeholder="Tell us how we can help (at least 10 characters)"
              @blur="validateField('message')"
            ></textarea>
            <div class="invalid-feedback">{{ errors.message }}</div>
            <div class="form-text">{{ form.message.length }} / 10 minimum characters</div>
          </div>

          <button type="submit" class="btn btn-greenroots w-100" :disabled="!isFormValid">
            <i class="bi bi-send me-2" aria-hidden="true"></i>Send Message
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
