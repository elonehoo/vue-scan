import { defineConfig } from 'tsdown'

export default defineConfig([
  // 主要的 ESM 构建
  {
    entry: ['src/index.ts'],
    platform: 'browser',
    fromVite: true,
    dts: {
      vue: true,
    },
    external: ['vue'],
    noExternal: ['lodash-es'],
  },
  // Auto 模式的 IIFE 构建（用于 script 标签）
  {
    entry: ['src/auto.ts'],
    platform: 'browser',
    fromVite: true,
    format: ['iife'],
    globalName: 'VueScan',
    outDir: 'dist',
    dts: false,
    external: [],
    noExternal: ['vue', 'lodash-es'],
    minify: true,
    sourcemap: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  },
])
