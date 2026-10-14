import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Lets `vite --mode emulator` reach the local Auth/Firestore/Functions emulators without
// loosening the CSP of the production build
function allowEmulatorsInCsp() {
  return {
    name: 'allow-emulators-in-csp',
    transformIndexHtml(html) {
      return html
        .replace(
          "connect-src 'self'",
          "connect-src 'self' http://127.0.0.1:9099 http://127.0.0.1:8080 http://127.0.0.1:5001",
        )
        .replace("frame-src 'self'", "frame-src 'self' http://127.0.0.1:9099")
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), vueDevTools(), mode === 'emulator' && allowEmulatorsInCsp()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // In production Firebase Hosting forwards /api to the api function; this does the same locally
  server: {
    proxy: {
      '/api':
        mode === 'emulator'
          ? {
              target: 'http://127.0.0.1:5001',
              rewrite: (path) => `/fit5032-1b795/australia-southeast2/api${path}`,
            }
          : { target: 'https://fit5032-1b795.web.app', changeOrigin: true },
    },
  },
}))
