<script setup>
import { ref } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'

const { form, errors, validateField, validateAll, isFormValid, resetForm } = useFormValidation(
  ['name', 'email', 'phone', 'age', 'skills', 'message'],
  {
    name: { type: 'required', label: 'Name' },
    email: { type: 'email', label: 'Email' },
    phone: { type: 'phone', label: 'Phone' },
    age: { type: 'ageRange', label: 'Age', min: 16, max: 100 },
    skills: { type: 'required', label: 'Area of interest' },
    message: { type: 'minLength', label: 'Message', min: 5 }
  }
)

const submitted = ref(false)
const submitSuccess = ref(false)

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
    resetForm()
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
            <i class="bi bi-clock fs-4 text-greenroots me-3" aria-hidden="true"></i>
            <div>
              <h6 class="mb-1">Flexible Hours</h6>
              <p class="small text-muted mb-0">
                Choose events that fit your schedule — weekdays, weekends, or school holidays.
              </p>
            </div>
          </div>
          <div class="d-flex align-items-start mb-3">
            <i class="bi bi-tools fs-4 text-greenroots me-3" aria-hidden="true"></i>
            <div>
              <h6 class="mb-1">No Experience Needed</h6>
              <p class="small text-muted mb-0">
                We provide all training, tools, and protective equipment.
              </p>
            </div>
          </div>
          <div class="d-flex align-items-start mb-3">
            <i class="bi bi-award fs-4 text-greenroots me-3" aria-hidden="true"></i>
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
              <button
                type="button"
                class="btn-close"
                aria-label="Dismiss confirmation message"
                @click="submitSuccess = false"
              ></button>
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
                    <i class="bi bi-person-plus me-2" aria-hidden="true"></i>Register as Volunteer
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
