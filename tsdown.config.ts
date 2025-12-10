import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'
import vue from 'unplugin-vue/rolldown'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  entry: [resolve(__dirname, 'src/index.ts')],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  plugins: [
    vue(),
  ],
  external: ['vue'],
  outDir: resolve(__dirname, 'dist'),
})
