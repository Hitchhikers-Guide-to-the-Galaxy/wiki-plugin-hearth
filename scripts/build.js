import esbuild from 'esbuild'
import fs from 'node:fs'

esbuild.build({
  entryPoints: ['src/client/hearth.js'],
  bundle: true,
  format: 'iife',
  outfile: 'client/hearth.js',
  sourcemap: true,
  minify: true,
  metafile: true,
}).then(result => {
  fs.writeFileSync('meta-client.json', JSON.stringify(result.metafile))
  console.log('built client/hearth.js')
})
