<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useFormValidation } from '@/composables/useFormValidation'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isLoginMode = ref(true)
const authError = ref('')
const showPassword = ref(false)
const loading = ref(false)

const {
  form: loginForm,
  errors: loginErrors,
  validateField: loginValidateField,
  validateAll: loginValidateAll,
} = useFormValidation(['loginEmail', 'loginPassword'], {
  loginEmail: { type: 'email', label: 'Email' },
  loginPassword: { type: 'required', label: 'Password' },
})

const {
  form: regForm,
  errors: regErrors,
  validateField: regValidateField,
  validateAll: regValidateAll,
} = useFormValidation(['regName', 'regEmail', 'regPassword', 'regConfirm', 'regRole'], {
  regName: { type: 'required', label: 'Full name' },
  regEmail: { type: 'email', label: 'Email' },
  regPassword: { type: 'password', label: 'Password' },
  regConfirm: { type: 'required', label: 'Confirm password' },
  regRole: { type: 'required', label: 'Role' },
})

const confirmPasswordError = computed(() => {
  if (regForm.regConfirm && regForm.regConfirm !== regForm.regPassword) {
    return 'Passwords do not match'
  }
  return ''
})

async function handleLogin() {
  authError.value = ''
  if (!loginValidateAll()) return

  loading.value = true
  const result = await authStore.login(loginForm.loginEmail, loginForm.loginPassword)
  loading.value = false

  if (!result.success) {
    authError.value = result.message
    return
  }

  const redirect = route.query.redirect || '/dashboard'
  router.push(redirect)
}

async function handleRegister() {
  authError.value = ''
  if (!regValidateAll()) return
  if (confirmPasswordError.value) return

  loading.value = true
  const result = await authStore.register(
    regForm.regName,
    regForm.regEmail,
    regForm.regPassword,
    regForm.regRole,
  )
  loading.value = false

  if (!result.success) {
    authError.value = result.message
    return
  }

  router.push('/dashboard')
}

function switchMode() {
  isLoginMode.value = !isLoginMode.value
  authError.value = ''
}
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-5">
        <div class="text-center mb-4">
          <i class="bi bi-tree display-4 text-greenroots"></i>
          <h1 class="mt-2">GreenRoots Melbourne</h1>
        </div>

        <div class="card shadow">
          <div class="card-header p-0">
            <ul class="nav nav-tabs card-header-tabs">
              <li class="nav-item flex-fill">
                <a
                  class="nav-link text-center"
                  :class="{ active: isLoginMode }"
                  href="#"
                  @click.prevent="switchMode"
                >
                  <i class="bi bi-box-arrow-in-right me-1"></i>Sign In
                </a>
              </li>
              <li class="nav-item flex-fill">
                <a
                  class="nav-link text-center"
                  :class="{ active: !isLoginMode }"
                  href="#"
                  @click.prevent="switchMode"
                >
                  <i class="bi bi-person-plus me-1"></i>Create Account
                </a>
              </li>
            </ul>
          </div>

          <div class="card-body p-4">
            <div v-if="authError" class="alert alert-danger py-2">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ authError }}
            </div>

            <!-- ===== Sign In Form ===== -->
            <form v-if="isLoginMode" @submit.prevent="handleLogin" novalidate>
              <div class="mb-3">
                <label for="login-email" class="form-label">
                  Email Address <span class="text-danger">*</span>
                </label>
                <input
                  id="login-email"
                  v-model="loginForm.loginEmail"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': loginErrors.loginEmail }"
                  placeholder="your.email@example.com"
                  @blur="loginValidateField('loginEmail')"
                />
                <div class="invalid-feedback">{{ loginErrors.loginEmail }}</div>
              </div>

              <div class="mb-3">
                <label for="login-password" class="form-label">
                  Password <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <input
                    id="login-password"
                    v-model="loginForm.loginPassword"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': loginErrors.loginPassword }"
                    placeholder="Enter your password"
                    @blur="loginValidateField('loginPassword')"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="showPassword = !showPassword"
                    aria-label="Toggle password visibility"
                  >
                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                  <div class="invalid-feedback">{{ loginErrors.loginPassword }}</div>
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-greenroots w-100"
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </button>

              <p class="text-center mt-3 mb-0">
                Don't have an account?
                <a href="#" class="text-greenroots" @click.prevent="switchMode">Create one</a>
              </p>
            </form>

            <!-- ===== Register Form ===== -->
            <form v-else @submit.prevent="handleRegister" novalidate>
              <div class="mb-3">
                <label for="reg-name" class="form-label">
                  Full Name <span class="text-danger">*</span>
                </label>
                <input
                  id="reg-name"
                  v-model="regForm.regName"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': regErrors.regName }"
                  placeholder="Your full name"
                  @blur="regValidateField('regName')"
                />
                <div class="invalid-feedback">{{ regErrors.regName }}</div>
              </div>

              <div class="mb-3">
                <label for="reg-email" class="form-label">
                  Email Address <span class="text-danger">*</span>
                </label>
                <input
                  id="reg-email"
                  v-model="regForm.regEmail"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': regErrors.regEmail }"
                  placeholder="your.email@example.com"
                  @blur="regValidateField('regEmail')"
                />
                <div class="invalid-feedback">{{ regErrors.regEmail }}</div>
              </div>

              <div class="mb-3">
                <label for="reg-password" class="form-label">
                  Password <span class="text-danger">*</span>
                </label>
                <input
                  id="reg-password"
                  v-model="regForm.regPassword"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  :class="{ 'is-invalid': regErrors.regPassword }"
                  placeholder="Create a password"
                  @blur="regValidateField('regPassword')"
                />
                <div class="invalid-feedback">{{ regErrors.regPassword }}</div>
                <div class="form-text">
                  At least 8 characters, including a letter and a number
                </div>
              </div>

              <div class="mb-3">
                <label for="reg-confirm" class="form-label">
                  Confirm Password <span class="text-danger">*</span>
                </label>
                <input
                  id="reg-confirm"
                  v-model="regForm.regConfirm"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  :class="{
                    'is-invalid': regErrors.regConfirm || confirmPasswordError,
                  }"
                  placeholder="Confirm your password"
                  @blur="regValidateField('regConfirm')"
                />
                <div class="invalid-feedback">
                  {{ regErrors.regConfirm || confirmPasswordError }}
                </div>
              </div>

              <div class="mb-3">
                <label for="reg-role" class="form-label">
                  Role <span class="text-danger">*</span>
                </label>
                <select
                  id="reg-role"
                  v-model="regForm.regRole"
                  class="form-select"
                  :class="{ 'is-invalid': regErrors.regRole }"
                  @blur="regValidateField('regRole')"
                >
                  <option value="" disabled>Select your role</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Admin</option>
                </select>
                <div class="invalid-feedback">{{ regErrors.regRole }}</div>
              </div>

              <button
                type="submit"
                class="btn btn-greenroots w-100"
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                {{ loading ? 'Creating account...' : 'Create Account' }}
              </button>

              <p class="text-center mt-3 mb-0">
                Already have an account?
                <a href="#" class="text-greenroots" @click.prevent="switchMode">Sign in</a>
              </p>
            </form>
          </div>
        </div>

        <p class="text-center text-muted small mt-3">
          Demo admin: admin@greenroots.org.au / Admin123
        </p>
      </div>
    </div>
  </div>
</template>
