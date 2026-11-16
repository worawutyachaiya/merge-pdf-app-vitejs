const fs = require('node:fs')
const path = require('node:path')
const root = path.dirname(require.resolve('pdfjs-dist/package.json'))
for (const folder of ['cmaps', 'standard_fonts', 'wasm']) {
  fs.cpSync(path.join(root, folder), path.resolve(__dirname, '../public/pdfjs', folder), { recursive: true })
}
console.log('PDF viewer assets prepared')
