<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/init'
import { useFormValidation } from '@/composables/useFormValidation'
import { ATTACHMENT_ACCEPT, attachmentError, formatSize, readAsBase64 } from '@/utils/attachment'

// Same limit and address check as the sendBulkEmail Cloud Function
const BULK_LIMIT = 50
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USER_FACING_ERRORS = [
  'functions/invalid-argument',
  'functions/permission-denied',
  'functions/unavailable',
]
const RESULT_BADGES = {
  sent: 'text-bg-success',
  skipped: 'text-bg-secondary',
  failed: 'text-bg-danger',
}

const props = defineProps({
  // Selected registration rows: { id, name, email, source }
  recipients: { type: Array, required: true },
})
const emit = defineEmits(['close'])

const { form, errors, validateField, validateAll } = useFormValidation(['subject', 'message'], {
  subject: { type: 'required', label: 'Subject' },
  message: { type: 'minLength', label: 'Message', min: 10 },
})

const heading = ref(null)
const confirmDialog = ref(null)
const fileInput = ref(null)
const file = ref(null)
const fileError = ref('')
const sending = ref(false)
const error = ref('')
const outcome = ref(null)

// Preview of what the server will do: only website registrations are emailed, once per address
const plan = computed(() => {
  const seen = new Set()
  let samples = 0
  let invalid = 0
  let duplicates = 0
  for (const recipient of props.recipients) {
    const email = (recipient.email || '').trim().toLowerCase()
    if (recipient.source !== 'website') samples++
    else if (!EMAIL_PATTERN.test(email)) invalid++
    else if (seen.has(email)) duplicates++
    else seen.add(email)
  }
  return { emailable: seen.size, samples, invalid, duplicates }
})
const overLimit = computed(() => props.recipients.length > BULK_LIMIT)
const people = (count) => `${count} ${count === 1 ? 'volunteer' : 'volunteers'}`

function handleFileChange(event) {
  const chosen = event.target.files[0] || null
  file.value = null
  fileError.value = ''
  if (!chosen) return

  fileError.value = attachmentError(chosen)
  if (fileError.value) event.target.value = ''
  else file.value = chosen
}

function removeFile() {
  file.value = null
  fileError.value = ''
  fileInput.value.value = ''
}

function askToConfirm() {
  error.value = ''
  if (!validateAll() || fileError.value || overLimit.value || plan.value.emailable === 0) return
  confirmDialog.value.showModal()
}

async function send() {
  confirmDialog.value.close()
  sending.value = true
  try {
    const attachment = file.value
      ? { name: file.value.name, content: await readAsBase64(file.value) }
      : null
    const sendBulkEmail = httpsCallable(functions, 'sendBulkEmail', { timeout: 120000 })
    const { data } = await sendBulkEmail({
      registrationIds: props.recipients.map((recipient) => recipient.id),
      subject: form.subject.trim(),
      message: form.message,
      attachment,
    })
    outcome.value = data
    await nextTick()
    heading.value?.focus()
  } catch (sendError) {
    error.value = USER_FACING_ERRORS.includes(sendError.code)
      ? sendError.message.replace(/\s*\[\d{3}\]$/, '')
      : 'Sorry, the emails could not be sent. Please try again.'
  } finally {
    sending.value = false
  }
}

onMounted(() => heading.value?.focus())
</script>

<template>
  <section
    class="card shadow-sm border-success mb-4 bulk-email"
    aria-labelledby="bulk-email-heading"
  >
    <div class="card-body p-4">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
        <h2 id="bulk-email-heading" ref="heading" class="h5 mb-0" tabindex="-1">
          {{ outcome ? 'Bulk email results' : `Email ${people(recipients.length)}` }}
        </h2>
        <button
          type="button"
          class="btn-close"
          aria-label="Close bulk email"
          :disabled="sending"
          @click="emit('close')"
        ></button>
      </div>

      <template v-if="outcome">
        <div
          class="alert mb-3"
          :class="outcome.failed ? 'alert-warning' : 'alert-success'"
          role="status"
        >
          Sent {{ outcome.sent }} · Skipped {{ outcome.skipped }} · Failed {{ outcome.failed }}.
          <template v-if="outcome.sent">Each volunteer received their own copy.</template>
        </div>
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-3">
            <caption class="visually-hidden">
              Result for each selected volunteer
            </caption>
            <thead>
              <tr>
                <th scope="col">Volunteer</th>
                <th scope="col">Email</th>
                <th scope="col">Result</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in outcome.results" :key="result.id">
                <td>{{ result.name }}</td>
                <td class="text-break">{{ result.email }}</td>
                <td>
                  <span class="badge" :class="RESULT_BADGES[result.status]">{{
                    result.status
                  }}</span>
                </td>
                <td class="small text-muted">{{ result.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button type="button" class="btn btn-outline-secondary" @click="emit('close')">Done</button>
      </template>

      <template v-else>
        <div
          class="alert py-2"
          :class="overLimit || plan.emailable === 0 ? 'alert-warning' : 'alert-light border'"
        >
          <template v-if="overLimit">
            You can email up to {{ BULK_LIMIT }} volunteers at a time. Please select fewer.
          </template>
          <template v-else>
            <strong>{{ people(plan.emailable) }}</strong> will receive this email.
            <span v-if="plan.samples">
              {{ plan.samples }} sample (Mockaroo) records will be skipped because they are not real
              mailboxes.
            </span>
            <span v-if="plan.invalid">
              {{ plan.invalid }} invalid {{ plan.invalid === 1 ? 'address' : 'addresses' }} will be
              skipped.
            </span>
            <span v-if="plan.duplicates">
              {{ plan.duplicates }} duplicate {{ plan.duplicates === 1 ? 'address' : 'addresses' }}
              will be emailed once.
            </span>
          </template>
        </div>

        <div v-if="error" class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>{{ error }}
        </div>

        <form novalidate @submit.prevent="askToConfirm">
          <div class="mb-3">
            <label for="bulk-subject" class="form-label">
              Subject <span class="text-danger">*</span>
            </label>
            <input
              id="bulk-subject"
              v-model="form.subject"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.subject }"
              maxlength="150"
              placeholder="Your GreenRoots event this weekend"
              @blur="validateField('subject')"
              @input="errors.subject && validateField('subject')"
            />
            <div class="invalid-feedback">{{ errors.subject }}</div>
          </div>

          <div class="mb-3">
            <label for="bulk-message" class="form-label">
              Message <span class="text-danger">*</span>
            </label>
            <textarea
              id="bulk-message"
              v-model="form.message"
              class="form-control"
              :class="{ 'is-invalid': errors.message }"
              rows="6"
              maxlength="5000"
              aria-describedby="bulk-message-help"
              placeholder="Hi {name}, thanks for signing up for {event}..."
              @blur="validateField('message')"
              @input="errors.message && validateField('message')"
            ></textarea>
            <div class="invalid-feedback">{{ errors.message }}</div>
            <div id="bulk-message-help" class="form-text">
              Write <code>{name}</code> for each volunteer's first name and <code>{event}</code> for
              the event they registered for. {{ form.message.length }} / 5000 characters.
            </div>
          </div>

          <div class="mb-4">
            <label for="bulk-attachment" class="form-label">Attachment (optional)</label>
            <input
              id="bulk-attachment"
              ref="fileInput"
              type="file"
              class="form-control"
              :class="{ 'is-invalid': fileError }"
              :accept="ATTACHMENT_ACCEPT"
              aria-describedby="bulk-attachment-help"
              @change="handleFileChange"
            />
            <div class="invalid-feedback">{{ fileError }}</div>
            <div id="bulk-attachment-help" class="form-text">PDF, PNG, JPG or ICS, up to 2 MB.</div>
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

          <button
            type="submit"
            class="btn btn-greenroots"
            :disabled="sending || overLimit || plan.emailable === 0"
          >
            <span
              v-if="sending"
              class="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-send me-2" aria-hidden="true"></i>
            {{ sending ? 'Sending...' : `Send to ${people(plan.emailable)}` }}
          </button>
        </form>
      </template>
    </div>

    <dialog
      ref="confirmDialog"
      class="confirm-dialog rounded shadow border-0 p-4"
      aria-labelledby="bulk-confirm-heading"
      aria-describedby="bulk-confirm-text"
    >
      <h2 id="bulk-confirm-heading" class="h5">Send this email?</h2>
      <p id="bulk-confirm-text">
        "{{ form.subject.trim() }}" will be sent to <strong>{{ people(plan.emailable) }}</strong
        >. Each person gets their own copy, so no one sees anyone else's address.
      </p>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-outline-secondary" @click="confirmDialog.close()">
          Cancel
        </button>
        <button type="button" class="btn btn-greenroots" @click="send">
          Send {{ plan.emailable }} {{ plan.emailable === 1 ? 'email' : 'emails' }}
        </button>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
#bulk-email-heading:focus {
  outline: none;
}

/* Cards lift on hover elsewhere on the site, which is distracting while typing here */
.bulk-email:hover {
  transform: none;
}

.confirm-dialog {
  max-width: min(32rem, calc(100vw - 2rem));
}

.confirm-dialog::backdrop {
  background: rgba(0, 0, 0, 0.45);
}
</style>
