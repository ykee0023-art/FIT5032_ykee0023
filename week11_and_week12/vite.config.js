import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this app from /<repository-name>/. The workflow sets
  // DEPLOY_TARGET so Cloudflare Pages and local builds keep serving from /.
  base: process.env.DEPLOY_TARGET === 'github-pages' ? '/FIT5032_ykee0023/' : '/',

  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
