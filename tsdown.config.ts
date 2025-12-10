import { defineConfig } from 'tsdown'

export default defineConfig({
  platform: 'browser',
  fromVite: true,
  dts: {
    vue: true,
  },
  external: ['vue'],
  noExternal: ['lodash-es'],
})
