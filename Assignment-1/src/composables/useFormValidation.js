import { reactive, computed } from 'vue'

export function useFormValidation(fields, rules) {
  const form = reactive(
    Object.fromEntries(fields.map((f) => [f, '']))
  )

  const errors = reactive(
    Object.fromEntries(fields.map((f) => [f, '']))
  )

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
    }
  }

  function validateField(field) {
    const rule = rules[field]
    if (!rule) return
    const { type, label, min, max } = rule
    errors[field] = validators[type](form[field], label, min, max)
  }

  function validateAll() {
    fields.forEach(validateField)
    return fields.every((f) => !errors[f])
  }

  const isFormValid = computed(() =>
    fields.every((f) => form[f] && !errors[f])
  )

  function resetForm() {
    fields.forEach((f) => {
      form[f] = ''
      errors[f] = ''
    })
  }

  return { form, errors, validateField, validateAll, isFormValid, resetForm }
}
