/**
 * scripts/patch-metro.js
 *
 * Fixes metro 0.84+ incompatibility with react-native 0.76 / Expo 52.
 *
 * Problem: metro 0.84.x uses strict "exports" field in package.json,
 * blocking internal imports that react-native and @expo/metro-config rely on.
 *
 * Fix: expose all internal ./src/** paths in the exports map of every metro-* package.
 *
 * Runs automatically via the "postinstall" hook in package.json.
 */

const fs = require('fs')
const path = require('path')

const nodeModules = path.join(__dirname, '..', 'node_modules')

function patchPackage(pkgJsonPath) {
  if (!fs.existsSync(pkgJsonPath)) return

  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
  } catch {
    return
  }

  const exports = pkg.exports
  if (!exports || typeof exports !== 'object') return

  const pkgDir = path.dirname(pkgJsonPath)
  const srcDir = path.join(pkgDir, 'src')
  if (!fs.existsSync(srcDir)) return

  let added = 0

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith('.js')) {
        const rel = './' + path.relative(pkgDir, full).replace(/\\/g, '/')
        const relNoExt = rel.slice(0, -3)
        if (!exports[rel]) { exports[rel] = rel; added++ }
        if (!exports[relNoExt]) { exports[relNoExt] = rel; added++ }
      }
    }
  }

  walk(srcDir)

  if (added > 0) {
    pkg.exports = exports
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2))
    const name = pkgJsonPath.split('node_modules' + path.sep)[1].split(path.sep + 'package')[0]
    console.log(`[patch-metro] ✅ Patched ${name} (+${added} exports)`)
  }
}

// Patch all metro-* and @expo/metro-* packages
const targets = fs.readdirSync(nodeModules).filter(n => n.startsWith('metro'))
targets.forEach(name => {
  patchPackage(path.join(nodeModules, name, 'package.json'))
})

const expoDir = path.join(nodeModules, '@expo')
if (fs.existsSync(expoDir)) {
  fs.readdirSync(expoDir).filter(n => n.startsWith('metro')).forEach(name => {
    patchPackage(path.join(expoDir, name, 'package.json'))
  })
}

// Fix 2: metro 0.84 sourceMapString.js missing default export
// @expo/metro-config does require(...).default which is undefined in named-export-only modules
const sourceMapStringPath = path.join(
  nodeModules, 'metro', 'src', 'DeltaBundler', 'Serializers', 'sourceMapString.js'
)
if (fs.existsSync(sourceMapStringPath)) {
  const content = fs.readFileSync(sourceMapStringPath, 'utf8')
  if (!content.includes('exports.default')) {
    fs.writeFileSync(
      sourceMapStringPath,
      content + '\n// Compat patch: @expo/metro-config expects a default export\nexports.default = sourceMapString;\n'
    )
    console.log('[patch-metro] ✅ Patched sourceMapString.js (added default export)')
  }
}

console.log('[patch-metro] Done.')
