import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === 'production' ? '/acb123/' : '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@c': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@m': fileURLToPath(new URL('./src/modules', import.meta.url)),
    },
  },
})
