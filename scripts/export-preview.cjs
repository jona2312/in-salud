// Export an isolated demo with no production environment loaded.
const { spawnSync } = require('node:child_process')
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('EXPO_PUBLIC_')))
Object.assign(env, { EXPO_PUBLIC_DEMO_MODE: 'true', EXPO_NO_DOTENV: '1', CI: '1' })
const result = spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'export', '--platform', 'web', '--output-dir', 'preview-dist'], { stdio: 'inherit', env })
if (result.status !== 0) process.exit(result.status ?? 1)
const fs = require('node:fs')
const file = 'preview-dist/index.html'
let html = fs.readFileSync(file, 'utf8')
html = html.replace('lang="en"', 'lang="es"').replace('<title>in-salud</title>', '<title>INsalud · Demo de bitácora</title>')
html = html.replace('</head>', `<meta name="description" content="Demo privada de INsalud con datos ficticios. Documentos, indicaciones y agenda." />
<meta name="robots" content="noindex, nofollow" />
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23176F60'/%3E%3Cpath d='M14 7h4v7h7v4h-7v7h-4v-7H7v-4h7z' fill='white'/%3E%3C/svg%3E" />
</head>`)
fs.writeFileSync(file, html)
process.exit(0)
