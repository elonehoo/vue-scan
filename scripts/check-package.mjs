import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'

const root = process.cwd()
const temporary = mkdtempSync(join(tmpdir(), '.package-check-'))
const consumer = join(temporary, 'consumer')
const packageName = 'vue-plugin-scan'

function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
}

try {
  const packed = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary]))
  run('tar', ['-xzf', join(temporary, packed[0].filename), '-C', temporary])
  const scope = join(consumer, 'node_modules')
  mkdirSync(scope, { recursive: true })
  renameSync(join(temporary, 'package'), join(scope, packageName))
  // Link the declared Vue dependency with its validated dependency closure.
  for (const name of ['vue'])
    symlinkSync(resolve(root, 'node_modules', name), join(scope, name), 'dir')
  // An external package scope cannot inherit the repository's node_modules.
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'package-consumer', private: true, type: 'module' }))

  writeFileSync(join(consumer, 'esm.mts'), `import scan, { getConfig } from '${packageName}'\nimport type { Plugin } from 'vue'\nconst plugin: Plugin = scan\nconst enabled: boolean = getConfig().enabled\nvoid plugin; void enabled\n`)
  const compiler = resolve(root, 'node_modules/typescript/bin/tsc')
  const options = [compiler, '--noEmit', '--strict', '--skipLibCheck', 'false', '--target', 'ES2022']
  run(process.execPath, [...options, '--module', 'NodeNext', '--moduleResolution', 'NodeNext', join(consumer, 'esm.mts')], consumer)
  run(process.execPath, [...options, '--module', 'ESNext', '--moduleResolution', 'Bundler', join(consumer, 'esm.mts')], consumer)
  writeFileSync(join(consumer, 'esm.mjs'), `import scan, { getConfig, toggleEnabled, resetConfig } from '${packageName}'; import assert from 'node:assert/strict'; assert.equal(typeof scan.install, 'function'); assert.equal(getConfig().enabled, true); assert.equal(toggleEnabled(), false); assert.equal(getConfig().enabled, false); resetConfig(); assert.equal(getConfig().enabled, true);`)
  run(process.execPath, [join(consumer, 'esm.mjs')], consumer)
}
finally {
  rmSync(temporary, { recursive: true, force: true })
}
