<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useFormValidation } from '@/composables/useFormValidation'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 'login' | 'register' | 'reset'
const mode = ref('login')
const authError = ref('')
const statusMessage = ref('')
const showPassword = ref(false)
// Name of the action in progress ('email', 'google', 'register', 'reset'); disables all buttons
const loading = ref('')

const isLoginMode = computed(() => mode.value !== 'register')

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
} = useFormValidation(['regName', 'regEmail', 'regPassword', 'regConfirm'], {
  regName: { type: 'required', label: 'Full name' },
  regEmail: { type: 'email', label: 'Email' },
  regPassword: { type: 'password', label: 'Password' },
  regConfirm: { type: 'required', label: 'Confirm password' },
})

const {
  form: resetForm,
  errors: resetErrors,
  validateField: resetValidateField,
  validateAll: resetValidateAll,
} = useFormValidation(['resetEmail'], {
  resetEmail: { type: 'email', label: 'Email' },
})

const confirmPasswordError = computed(() => {
  if (regForm.regConfirm && regForm.regConfirm !== regForm.regPassword) {
    return 'Passwords do not match'
  }
  return ''
})

// Only follow in-app paths from ?redirect=, never an external URL (open redirect)
function redirectTarget() {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return '/dashboard'
}

async function handleLogin() {
  authError.value = ''
  if (!loginValidateAll()) return

  loading.value = 'email'
  const result = await authStore.login(loginForm.loginEmail, loginForm.loginPassword)
  loading.value = ''

  if (!result.success) {
    authError.value = result.message
    return
  }

  router.push(redirectTarget())
}

async function handleGoogle() {
  authError.value = ''

  loading.value = 'google'
  const result = await authStore.loginWithGoogle()
  loading.value = ''

  if (!result.success) {
    authError.value = result.message
    return
  }

  router.push(redirectTarget())
}

async function handleRegister() {
  authError.value = ''
  if (!regValidateAll()) return
  if (confirmPasswordError.value) return

  loading.value = 'register'
  const result = await authStore.register(regForm.regName, regForm.regEmail, regForm.regPassword)
  loading.value = ''

  if (!result.success) {
    authError.value = result.message
    return
  }

  router.push(redirectTarget())
}

async function handleReset() {
  authError.value = ''
  statusMessage.value = ''
  if (!resetValidateAll()) return

  loading.value = 'reset'
  const result = await authStore.resetPassword(resetForm.resetEmail)
  loading.value = ''

  if (!result.success) {
    authError.value = result.message
    return
  }

  statusMessage.value =
    'If an account exists for this email, we have sent a password reset link. Please check your inbox and spam folder.'
}

function setMode(newMode) {
  mode.value = newMode
  authError.value = ''
  statusMessage.value = ''
  if (newMode === 'reset') {
    resetForm.resetEmail = loginForm.loginEmail
  }
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
            <!-- Buttons, not links: they switch the form on this page rather than navigate -->
            <ul class="nav nav-tabs card-header-tabs">
              <li class="nav-item flex-fill">
                <button
                  type="button"
                  class="nav-link w-100 text-center"
                  :class="{ active: isLoginMode }"
                  :aria-pressed="isLoginMode"
                  @click="setMode('login')"
                >
                  <i class="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>Sign In
                </button>
              </li>
              <li class="nav-item flex-fill">
                <button
                  type="button"
                  class="nav-link w-100 text-center"
                  :class="{ active: !isLoginMode }"
                  :aria-pressed="!isLoginMode"
                  @click="setMode('register')"
                >
                  <i class="bi bi-person-plus me-1" aria-hidden="true"></i>Create Account
                </button>
              </li>
            </ul>
          </div>

          <div class="card-body p-4">
            <div v-if="authError" class="alert alert-danger py-2" role="alert">
              <i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>{{ authError }}
            </div>
            <div v-if="statusMessage" class="alert alert-success py-2" role="status">
              <i class="bi bi-envelope-check me-1" aria-hidden="true"></i>{{ statusMessage }}
            </div>

            <!-- ===== Google Sign-In (works for both new and existing accounts) ===== -->
            <template v-if="mode !== 'reset'">
              <button
                type="button"
                class="btn btn-outline-secondary w-100"
                :disabled="!!loading"
                @click="handleGoogle"
              >
                <span
                  v-if="loading === 'google'"
                  class="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                ></span>
                <i v-else class="bi bi-google me-2" aria-hidden="true"></i>
                {{ loading === 'google' ? 'Waiting for Google...' : 'Continue with Google' }}
              </button>

              <div class="d-flex align-items-center my-3" aria-hidden="true">
                <hr class="flex-grow-1" />
                <span class="px-2 text-muted small">or use your email</span>
                <hr class="flex-grow-1" />
              </div>
            </template>

            <!-- ===== Sign In Form ===== -->
            <form v-if="mode === 'login'" @submit.prevent="handleLogin" novalidate>
              <div class="mb-3">
                <label for="login-email" class="form-label">
                  Email Address <span class="text-danger">*</span>
                </label>
                <input
                  id="login-email"
                  v-model="loginForm.loginEmail"
                  type="email"
                  autocomplete="email"
                  class="form-control"
                  :class="{ 'is-invalid': loginErrors.loginEmail }"
                  placeholder="your.email@example.com"
                  @blur="loginValidateField('loginEmail')"
                />
                <div class="invalid-feedback">{{ loginErrors.loginEmail }}</div>
              </div>

              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-baseline">
                  <label for="login-password" class="form-label">
                    Password <span class="text-danger">*</span>
                  </label>
                  <button
                    type="button"
                    class="btn btn-link btn-sm p-0 text-greenroots"
                    @click="setMode('reset')"
                  >
                    Forgot password?
                  </button>
                </div>
                <div class="input-group">
                  <input
                    id="login-password"
                    v-model="loginForm.loginPassword"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
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

              <button type="submit" class="btn btn-greenroots w-100" :disabled="!!loading">
                <span
                  v-if="loading === 'email'"
                  class="spinner-border spinner-border-sm me-1"
                  aria-hidden="true"
                ></span>
                {{ loading === 'email' ? 'Signing in...' : 'Sign In' }}
              </button>

              <p class="text-center mt-3 mb-0">
                Don't have an account?
                <a href="#" class="text-greenroots" @click.prevent="setMode('register')"
                  >Create one</a
                >
              </p>
            </form>

            <!-- ===== Reset Password Form ===== -->
            <form v-else-if="mode === 'reset'" @submit.prevent="handleReset" novalidate>
              <h2 class="h5">Reset your password</h2>
              <p class="text-muted small">
                Enter the email you signed up with and we will send you a link to choose a new
                password.
              </p>

              <div class="mb-3">
                <label for="reset-email" class="form-label">
                  Email Address <span class="text-danger">*</span>
                </label>
                <input
                  id="reset-email"
                  v-model="resetForm.resetEmail"
                  type="email"
                  autocomplete="email"
                  class="form-control"
                  :class="{ 'is-invalid': resetErrors.resetEmail }"
                  placeholder="your.email@example.com"
                  @blur="resetValidateField('resetEmail')"
                />
                <div class="invalid-feedback">{{ resetErrors.resetEmail }}</div>
              </div>

              <button type="submit" class="btn btn-greenroots w-100" :disabled="!!loading">
                <span
                  v-if="loading === 'reset'"
                  class="spinner-border spinner-border-sm me-1"
                  aria-hidden="true"
                ></span>
                {{ loading === 'reset' ? 'Sending...' : 'Send Reset Link' }}
              </button>

              <p class="text-center mt-3 mb-0">
                <a href="#" class="text-greenroots" @click.prevent="setMode('login')">
                  Back to sign in
                </a>
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
                  autocomplete="name"
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
                  autocomplete="email"
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
                  autocomplete="new-password"
                  class="form-control"
                  :class="{ 'is-invalid': regErrors.regPassword }"
                  placeholder="Create a password"
                  @blur="regValidateField('regPassword')"
                />
                <div class="invalid-feedback">{{ regErrors.regPassword }}</div>
                <div class="form-text">At least 8 characters, including a letter and a number</div>
              </div>

              <div class="mb-3">
                <label for="reg-confirm" class="form-label">
                  Confirm Password <span class="text-danger">*</span>
                </label>
                <input
                  id="reg-confirm"
                  v-model="regForm.regConfirm"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
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

              <p class="form-text mb-3">
                New accounts join as volunteers. Admin access is granted by GreenRoots staff.
              </p>

              <button type="submit" class="btn btn-greenroots w-100" :disabled="!!loading">
                <span
                  v-if="loading === 'register'"
                  class="spinner-border spinner-border-sm me-1"
                  aria-hidden="true"
                ></span>
                {{ loading === 'register' ? 'Creating account...' : 'Create Account' }}
              </button>

              <p class="text-center mt-3 mb-0">
                Already have an account?
                <a href="#" class="text-greenroots" @click.prevent="setMode('login')">Sign in</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
