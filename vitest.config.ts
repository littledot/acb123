import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@c': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@m': fileURLToPath(new URL('./src/modules', import.meta.url)),
    }
  },
  define: {
    __DEV__: true,
    __TEST__: true
  },
  test: {
    // simulate DOM with happy-dom
    // (requires installing happy-dom as a peer dependency)
    environment: 'happy-dom',
    setupFiles: fileURLToPath(new URL('./vitest.setup.ts', import.meta.url)),
    restoreMocks: true,
  },
})
