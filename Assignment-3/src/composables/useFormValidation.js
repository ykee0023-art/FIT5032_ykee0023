import { reactive, computed, nextTick, watch } from 'vue'

export function useFormValidation(fields, rules) {
  const form = reactive(Object.fromEntries(fields.map((f) => [f, ''])))

  const errors = reactive(Object.fromEntries(fields.map((f) => [f, ''])))

  const validators = {
    required(value, fieldName) {
      if (!value || String(value).trim() === '') {
        return `${fieldName} is required`
      }
      return ''
    },

    email(value) {
      if (!value || value.trim() === '') return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address'
      }
      return ''
    },

    minLength(value, fieldName, min) {
      if (!value || value.trim() === '') return `${fieldName} is required`
      if (value.trim().length < min) {
        return `${fieldName} must be at least ${min} characters`
      }
      return ''
    },

    phone(value) {
      if (!value || value.trim() === '') return 'Phone number is required'
      if (!/^(\+61|0)[2-9]\d{8}$/.test(value.replace(/\s/g, ''))) {
        return 'Please enter a valid Australian phone number (e.g. 0412345678)'
      }
      return ''
    },

    ageRange(value, fieldName, min, max) {
      if (value === '' || value === null || value === undefined) {
        return `${fieldName} is required`
      }
      const num = Number(value)
      if (isNaN(num) || num < min || num > max) {
        return `${fieldName} must be between ${min} and ${max}`
      }
      return ''
    },

    password(value) {
      if (!value || value.trim() === '') return 'Password is required'
      if (value.length < 8) return 'Password must be at least 8 characters'
      if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least one letter'
      if (!/[0-9]/.test(value)) return 'Password must contain at least one number'
      return ''
    },
  }

  function validateField(field) {
    const rule = rules[field]
    if (!rule) return
    const { type, label, min, max } = rule
    errors[field] = validators[type](form[field], label, min, max)
  }

  // Once a field shows an error, re-check it as the user types so the message clears straight
  // away. Otherwise it clears on blur, and that layout shift can swallow a click on Submit.
  watch(
    () => fields.map((f) => form[f]),
    (now, before) => {
      fields.forEach((f, i) => {
        if (errors[f] && now[i] !== before[i]) validateField(f)
      })
    },
  )

  function validateAll() {
    fields.forEach(validateField)
    const valid = fields.every((f) => !errors[f])
    // Move to the first invalid field so screen readers announce its error (WCAG 3.3.1)
    if (!valid) nextTick(() => document.querySelector('[aria-invalid="true"]')?.focus())
    return valid
  }

  const isFormValid = computed(() => fields.every((f) => form[f] && !errors[f]))

  function resetForm() {
    fields.forEach((f) => {
      form[f] = ''
      errors[f] = ''
    })
  }

  return { form, errors, validateField, validateAll, isFormValid, resetForm }
}
