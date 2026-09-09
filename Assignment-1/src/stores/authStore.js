import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { hashPassword, generateId } from '@/utils/security'

const USERS_KEY = 'greenroots_users'
const SESSION_KEY = 'greenroots_session'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)

  const isAuthenticated = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const userRole = computed(() => currentUser.value?.role || 'guest')
  const userName = computed(() => currentUser.value?.name || '')

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  function setSession(user) {
    const { passwordHash, ...sessionData } = user
    currentUser.value = sessionData
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
  }

  async function seedDefaultAdmin() {
    const passwordHash = await hashPassword('Admin123')
    const admin = {
      id: generateId(),
      name: 'GreenRoots Admin',
      email: 'admin@greenroots.org.au',
      passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    }
    saveUsers([admin])
  }

  async function initAuth() {
    const session = sessionStorage.getItem(SESSION_KEY)
    if (session) {
      currentUser.value = JSON.parse(session)
    }

    const users = getUsers()
    if (users.length === 0) {
      await seedDefaultAdmin()
    }
  }

  async function register(name, email, password, role) {
    const users = getUsers()
    const normalizedEmail = email.toLowerCase().trim()

    if (users.some((u) => u.email === normalizedEmail)) {
      return { success: false, message: 'Email already registered' }
    }

    const passwordHash = await hashPassword(password)
    const newUser = {
      id: generateId(),
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    saveUsers(users)
    setSession(newUser)

    return { success: true, message: '' }
  }

  async function login(email, password) {
    const users = getUsers()
    const inputHash = await hashPassword(password)
    const normalizedEmail = email.toLowerCase().trim()

    const user = users.find(
      (u) => u.email === normalizedEmail && u.passwordHash === inputHash,
    )

    if (!user) {
      return { success: false, message: 'Invalid email or password' }
    }

    setSession(user)
    return { success: true, message: '' }
  }

  function logout() {
    currentUser.value = null
    sessionStorage.removeItem(SESSION_KEY)
  }

  function getAllUsers() {
    return getUsers().map(({ passwordHash, ...rest }) => rest)
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    userRole,
    userName,
    initAuth,
    register,
    login,
    logout,
    getAllUsers,
  }
})
