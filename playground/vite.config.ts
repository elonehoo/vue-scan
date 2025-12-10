import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-plugin-scan': resolve(__dirname, '../src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['vue-plugin-scan'],
  },
})
