<script setup>
import { reactive, ref, computed } from 'vue'

const form = reactive({
  name: '',
  email: '',
  phone: '',
  age: '',
  skills: '',
  message: ''
})

const errors = reactive({
  name: '',
  email: '',
  phone: '',
  age: '',
  skills: '',
  message: ''
})

const submitted = ref(false)
const submitSuccess = ref(false)

function validateRequired(value, fieldName) {
  if (!value || String(value).trim() === '') {
    return `${fieldName} is required`
  }
  return ''
}

function validateEmail(value) {
  if (!value || value.trim() === '') {
    return 'Email is required'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address'
  }
  return ''
}

function validatePhone(value) {
  if (!value || value.trim() === '') {
    return 'Phone number is required'
  }
  const phoneRegex = /^(\+61|0)[2-9]\d{8}$/
  if (!phoneRegex.test(value.replace(/\s/g, ''))) {
    return 'Please enter a valid Australian phone number (e.g. 0412345678)'
  }
  return ''
}

function validateAge(value) {
  if (value === '' || value === null || value === undefined) {
    return 'Age is required'
  }
  const num = Number(value)
  if (isNaN(num) || num < 16 || num > 100) {
    return 'Age must be between 16 and 100'
  }
  return ''
}

function validateMinLength(value, fieldName, minLen) {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`
  }
  if (value.trim().length < minLen) {
    return `${fieldName} must be at least ${minLen} characters`
  }
  return ''
}

function validateField(field) {
  switch (field) {
    case 'name':
      errors.name = validateRequired(form.name, 'Name')
      break
    case 'email':
      errors.email = validateEmail(form.email)
      break
    case 'phone':
      errors.phone = validatePhone(form.phone)
      break
    case 'age':
      errors.age = validateAge(form.age)
      break
    case 'skills':
      errors.skills = validateRequired(form.skills, 'Area of interest')
      break
    case 'message':
      errors.message = validateMinLength(form.message, 'Message', 5)
      break
  }
}

function validateAll() {
  validateField('name')
  validateField('email')
  validateField('phone')
  validateField('age')
  validateField('skills')
  validateField('message')
  return (
    !errors.name &&
    !errors.email &&
    !errors.phone &&
    !errors.age &&
    !errors.skills &&
    !errors.message
  )
}

const isFormValid = computed(() => {
  return (
    form.name &&
    form.email &&
    form.phone &&
    form.age &&
    form.skills &&
    form.message &&
    !errors.name &&
    !errors.email &&
    !errors.phone &&
    !errors.age &&
    !errors.skills &&
    !errors.message
  )
})

function handleSubmit() {
  submitted.value = true
  if (validateAll()) {
    const registrations = JSON.parse(localStorage.getItem('volunteerRegistrations') || '[]')
    registrations.push({
      ...form,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('volunteerRegistrations', JSON.stringify(registrations))

    submitSuccess.value = true
    Object.assign(form, { name: '', email: '', phone: '', age: '', skills: '', message: '' })
    Object.assign(errors, { name: '', email: '', phone: '', age: '', skills: '', message: '' })
    submitted.value = false
  }
}
</script>

<template>
  <div class="container py-5">
    <div class="row g-5">
      <div class="col-12 col-lg-5">
        <h1 class="mb-3">Get Involved</h1>
        <p class="lead">
          Join GreenRoots Melbourne as a volunteer and help us plant a greener future for our city.
        </p>
        <div class="mt-4">
          <div class="d-flex align-items-start mb-3">
            <i class="bi bi-clock fs-4 text-greenroots me-3"></i>
            <div>
              <h6 class="mb-1">Flexible Hours</h6>
              <p class="small text-muted mb-0">
                Choose events that fit your schedule — weekdays, weekends, or school holidays.
              </p>
            </div>
          </div>
          <div class="d-flex align-items-start mb-3">
            <i class="bi bi-tools fs-4 text-greenroots me-3"></i>
            <div>
              <h6 class="mb-1">No Experience Needed</h6>
              <p class="small text-muted mb-0">
                We provide all training, tools, and protective equipment.
              </p>
            </div>
          </div>
          <div class="d-flex align-items-start mb-3">
            <i class="bi bi-award fs-4 text-greenroots me-3"></i>
            <div>
              <h6 class="mb-1">Certificate of Participation</h6>
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
            <h4 class="card-title mb-3">Volunteer Registration</h4>

            <div v-if="submitSuccess" class="alert alert-success alert-dismissible" role="alert">
              Thank you for registering! We will contact you about upcoming events.
              <button type="button" class="btn-close" @click="submitSuccess = false"></button>
            </div>

            <form @submit.prevent="handleSubmit" novalidate>
              <div class="row g-3">
                <div class="col-12 col-sm-6">
                  <label for="vol-name" class="form-label">
                    Full Name <span class="text-danger">*</span>
                  </label>
                  <input
                    id="vol-name"
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    :class="{
                      'is-invalid': errors.name,
                      'is-valid': submitted && !errors.name && form.name
                    }"
                    placeholder="Your full name"
                    @blur="validateField('name')"
                  />
                  <div class="invalid-feedback">{{ errors.name }}</div>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="vol-email" class="form-label">
                    Email <span class="text-danger">*</span>
                  </label>
                  <input
                    id="vol-email"
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

                <div class="col-12 col-sm-6">
                  <label for="vol-phone" class="form-label">
                    Phone <span class="text-danger">*</span>
                  </label>
                  <input
                    id="vol-phone"
                    v-model="form.phone"
                    type="tel"
                    class="form-control"
                    :class="{
                      'is-invalid': errors.phone,
                      'is-valid': submitted && !errors.phone && form.phone
                    }"
                    placeholder="0412 345 678"
                    @blur="validateField('phone')"
                  />
                  <div class="invalid-feedback">{{ errors.phone }}</div>
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
                      'is-valid': submitted && !errors.age && form.age
                    }"
                    placeholder="Must be 16-100"
                    @blur="validateField('age')"
                  />
                  <div class="invalid-feedback">{{ errors.age }}</div>
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
                      'is-valid': submitted && !errors.skills && form.skills
                    }"
                    @blur="validateField('skills')"
                  >
                    <option value="" disabled>Select your interest</option>
                    <option value="planting">Tree Planting</option>
                    <option value="gardening">Community Gardening</option>
                    <option value="education">Education & Workshops</option>
                    <option value="conservation">Habitat Conservation</option>
                    <option value="admin">Admin & Coordination</option>
                  </select>
                  <div class="invalid-feedback">{{ errors.skills }}</div>
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
                      'is-valid': submitted && !errors.message && form.message
                    }"
                    rows="3"
                    placeholder="Tell us about yourself (at least 5 characters)"
                    @blur="validateField('message')"
                  ></textarea>
                  <div class="invalid-feedback">{{ errors.message }}</div>
                </div>

                <div class="col-12">
                  <button
                    type="submit"
                    class="btn btn-greenroots w-100"
                    :disabled="!isFormValid"
                  >
                    <i class="bi bi-person-plus me-2"></i>Register as Volunteer
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
