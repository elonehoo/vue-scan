// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  vue: {
    overrides: {
      // Use the supported alias with the same effective newline behavior.
      'vue/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    },
  },
  ignores: [
    '.specstory/**',
  ],
})
