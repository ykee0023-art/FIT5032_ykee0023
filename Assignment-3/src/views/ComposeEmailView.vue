<script setup>
import { ref } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/init'
import { useFormValidation } from '@/composables/useFormValidation'

// Same limits as the sendEmail Cloud Function, which checks them again on the server
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'ics']
// Messages for these errors are written for the user by the Cloud Function
const USER_FACING_ERRORS = [
  'functions/invalid-argument',
  'functions/resource-exhausted',
  'functions/unavailable',
]

const { form, errors, validateField, validateAll, resetForm } = useFormValidation(
  ['to', 'subject', 'message'],
  {
    to: { type: 'email', label: 'Recipient email' },
    subject: { type: 'required', label: 'Subject' },
    message: { type: 'minLength', label: 'Message', min: 10 },
  },
)

const fileInput = ref(null)
const file = ref(null)
const fileError = ref('')
const sending = ref(false)
const result = ref(null)

function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function handleFileChange(event) {
  const chosen = event.target.files[0] || null
  file.value = null
  fileError.value = ''
  if (!chosen) return

  const extension = chosen.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    fileError.value = 'Please choose a PDF, PNG, JPG or ICS file.'
  } else if (chosen.size > MAX_ATTACHMENT_BYTES) {
    fileError.value = `This file is ${formatSize(chosen.size)}. Attachments must be smaller than 2 MB.`
  } else {
    file.value = chosen
    return
  }
  event.target.value = ''
}

function removeFile() {
  file.value = null
  fileError.value = ''
  fileInput.value.value = ''
}

function readAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function handleSend() {
  result.value = null
  if (!validateAll() || fileError.value || sending.value) return

  sending.value = true
  try {
    const attachment = file.value
      ? { name: file.value.name, content: await readAsBase64(file.value) }
      : null
    const sendEmail = httpsCallable(functions, 'sendEmail')
    await sendEmail({
      to: form.to.trim(),
      subject: form.subject.trim(),
      message: form.message,
      attachment,
    })

    result.value = {
      ok: true,
      text: `Your email to ${form.to.trim()} has been sent${attachment ? ` with ${attachment.name} attached` : ''}.`,
    }
    resetForm()
    removeFile()
  } catch (error) {
    result.value = {
      ok: false,
      // The SDK appends the HTTP status (e.g. " [429]"), which means nothing to the user
      text: USER_FACING_ERRORS.includes(error.code)
        ? error.message.replace(/\s*\[\d{3}\]$/, '')
        : 'Sorry, your email could not be sent. Please try again.',
    }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <h1 class="mb-2">Send an Email</h1>
        <p class="text-muted mb-4">
          Share an upcoming event or a resource with a friend. Emails are sent by GreenRoots
          Melbourne, and replies go straight to your own email address.
        </p>

        <div
          v-if="result"
          class="alert"
          :class="result.ok ? 'alert-success' : 'alert-danger'"
          :role="result.ok ? 'status' : 'alert'"
        >
          <i
            class="bi me-1"
            :class="result.ok ? 'bi-check-circle' : 'bi-exclamation-triangle'"
            aria-hidden="true"
          ></i>
          {{ result.text }}
        </div>

        <div class="card shadow-sm">
          <div class="card-body p-4">
            <form novalidate @submit.prevent="handleSend">
              <div class="mb-3">
                <label for="email-to" class="form-label">
                  To <span class="text-danger">*</span>
                </label>
                <input
                  id="email-to"
                  v-model="form.to"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': errors.to }"
                  placeholder="friend@example.com"
                  maxlength="254"
                  @blur="validateField('to')"
                />
                <div class="invalid-feedback">{{ errors.to }}</div>
              </div>

              <div class="mb-3">
                <label for="email-subject" class="form-label">
                  Subject <span class="text-danger">*</span>
                </label>
                <input
                  id="email-subject"
                  v-model="form.subject"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.subject }"
                  placeholder="Join me at a GreenRoots planting day"
                  maxlength="150"
                  @blur="validateField('subject')"
                />
                <div class="invalid-feedback">{{ errors.subject }}</div>
              </div>

              <div class="mb-3">
                <label for="email-message" class="form-label">
                  Message <span class="text-danger">*</span>
                </label>
                <textarea
                  id="email-message"
                  v-model="form.message"
                  class="form-control"
                  :class="{ 'is-invalid': errors.message }"
                  rows="6"
                  maxlength="5000"
                  aria-describedby="email-message-count"
                  @blur="validateField('message')"
                ></textarea>
                <div class="invalid-feedback">{{ errors.message }}</div>
                <div id="email-message-count" class="form-text">
                  {{ form.message.length }} / 5000 characters (at least 10)
                </div>
              </div>

              <div class="mb-4">
                <label for="email-attachment" class="form-label">Attachment (optional)</label>
                <input
                  id="email-attachment"
                  ref="fileInput"
                  type="file"
                  class="form-control"
                  :class="{ 'is-invalid': fileError }"
                  accept=".pdf,.png,.jpg,.jpeg,.ics,application/pdf,image/png,image/jpeg,text/calendar"
                  aria-describedby="email-attachment-help"
                  @change="handleFileChange"
                />
                <div class="invalid-feedback">{{ fileError }}</div>
                <div id="email-attachment-help" class="form-text">
                  PDF, PNG, JPG or ICS, up to 2 MB.
                </div>
                <div v-if="file" class="d-flex align-items-center gap-2 mt-2">
                  <span class="badge text-bg-light border">
                    <i class="bi bi-paperclip me-1" aria-hidden="true"></i>{{ file.name }} ({{
                      formatSize(file.size)
                    }})
                  </span>
                  <button
                    type="button"
                    class="btn btn-sm btn-link text-danger p-0"
                    :aria-label="`Remove attachment ${file.name}`"
                    @click="removeFile"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <button type="submit" class="btn btn-greenroots w-100" :disabled="sending">
                <span
                  v-if="sending"
                  class="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                ></span>
                <i v-else class="bi bi-send me-2" aria-hidden="true"></i>
                {{ sending ? 'Sending...' : 'Send Email' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
