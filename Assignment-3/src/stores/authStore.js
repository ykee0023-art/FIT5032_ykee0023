import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/init'

const ERROR_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password',
  'auth/wrong-password': 'Incorrect email or password',
  'auth/user-not-found': 'Incorrect email or password',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead',
  'auth/weak-password': 'Please choose a stronger password',
  'auth/user-disabled': 'This account has been disabled. Please contact us for help',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again',
  'auth/network-request-failed': 'Network error. Please check your connection and try again',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled',
  'auth/popup-blocked': 'The Google sign-in window was blocked. Please allow pop-ups for this site',
  'auth/unauthorized-domain': 'Google sign-in is not available on this website address',
}

function toMessage(error) {
  return ERROR_MESSAGES[error?.code] || 'Something went wrong. Please try again'
}

function toUser(id, data) {
  return {
    id,
    name: data.name,
    email: data.email,
    role: data.role,
    createdAt: data.createdAt?.toDate().toISOString(),
  }
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  let ready = null

  const isAuthenticated = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const userRole = computed(() => currentUser.value?.role || 'guest')
  const userName = computed(() => currentUser.value?.name || '')

  // Reads users/{uid}, creating a volunteer profile on first sign-in (e.g. with Google).
  // The role is never taken from the client: Firestore rules only accept 'volunteer' here.
  async function loadProfile(user) {
    const profileRef = doc(db, 'users', user.uid)
    let snapshot = await getDoc(profileRef)

    if (!snapshot.exists()) {
      await setDoc(profileRef, {
        name: (user.displayName || user.email.split('@')[0]).trim().slice(0, 100),
        email: user.email,
        role: 'volunteer',
        createdAt: serverTimestamp(),
      })
      snapshot = await getDoc(profileRef)
    }

    currentUser.value = toUser(user.uid, snapshot.data())
  }

  // Signs out again if the profile cannot be loaded, so the UI never shows a half-signed-in user
  async function completeSignIn(user) {
    try {
      await loadProfile(user)
    } catch (error) {
      await signOut(auth)
      throw error
    }
  }

  // Shared by main.js and the router guard, so both wait until Firebase restores the session
  function initAuth() {
    ready ??= (async () => {
      await auth.authStateReady()
      if (auth.currentUser) {
        await loadProfile(auth.currentUser).catch(() => {
          currentUser.value = null
        })
      }
    })()
    return ready
  }

  async function register(name, email, password) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(user, { displayName: name.trim() })
      await completeSignIn(user)
      return { success: true, message: '' }
    } catch (error) {
      return { success: false, message: toMessage(error) }
    }
  }

  async function login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password)
      await completeSignIn(user)
      return { success: true, message: '' }
    } catch (error) {
      return { success: false, message: toMessage(error) }
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const { user } = await signInWithPopup(auth, provider)
      await completeSignIn(user)
      return { success: true, message: '' }
    } catch (error) {
      return { success: false, message: toMessage(error) }
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim())
      return { success: true, message: '' }
    } catch (error) {
      // Report success for unknown emails too, so the form does not reveal which accounts exist
      if (error.code === 'auth/user-not-found') return { success: true, message: '' }
      return { success: false, message: toMessage(error) }
    }
  }

  async function logout() {
    await signOut(auth)
    currentUser.value = null
  }

  // Admin only: Firestore rules reject this query for other users
  async function getAllUsers() {
    const snapshot = await getDocs(collection(db, 'users'))
    return snapshot.docs.map((d) => toUser(d.id, d.data()))
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
    loginWithGoogle,
    resetPassword,
    logout,
    getAllUsers,
  }
})
