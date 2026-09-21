const ts = require('typescript')
const fs = require('node:fs')
const path = require('node:path')
exports.load = function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file)
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const module = { exports: {} }
  function req(name) { return name in mocks ? mocks[name] : require(name) }
  new Function('require', 'module', 'exports', js)(req, module, module.exports)
  return module.exports
}
