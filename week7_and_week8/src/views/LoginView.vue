<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-sm-6 offset-sm-3">
        <h1 class="text-center">Login</h1>
        <form @submit.prevent="login">
          <div class="mb-3">
            <label for="username" class="form-label">Username</label>
            <input type="text" class="form-control" id="username" v-model="username" />
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" id="password" v-model="password" />
          </div>
          <div v-if="error" class="text-danger mb-3">{{ error }}</div>
          <div class="text-center">
            <button type="submit" class="btn btn-primary">Login</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated } from '../auth'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')

const login = () => {
  if (username.value === 'admin' && password.value === 'password') {
    isAuthenticated.value = true
    router.push('/')
  } else {
    error.value = 'Invalid username or password.'
  }
}
</script>
