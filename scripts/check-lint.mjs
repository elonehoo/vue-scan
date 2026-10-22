import assert from 'node:assert/strict'
import { ESLint } from 'eslint'

const eslint = new ESLint()
const filePath = 'src/widget/ValidationFixture.vue'
const rule = 'vue/object-property-newline'
const config = await eslint.calculateConfigForFile(filePath)
assert.equal(config.rules[rule][0], 2)
assert.equal(config.rules[rule][1].allowAllPropertiesOnSameLine, true)
// The core-rule backend may insert the deprecated option's false default.
assert.notEqual(config.rules[rule][1].allowMultiplePropertiesPerLine, true)

const valid = `<template>
  <div :style="{ color: 'red', padding: '0' }" />
</template>
`
const invalid = `<template>
  <div :style="{
    color: 'red', padding: '0',
    margin: '0',
  }" />
</template>
`
const validResult = await eslint.lintText(valid, { filePath })
const invalidResult = await eslint.lintText(invalid, { filePath })
assert.equal(validResult[0].fatalErrorCount, 0)
assert.equal(invalidResult[0].fatalErrorCount, 0)
assert.equal(validResult[0].messages.filter(message => message.ruleId === rule).length, 0)
assert.equal(invalidResult[0].messages.filter(message => message.ruleId === rule).length, 1)
