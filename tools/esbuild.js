import { build } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const buildConfig = {
  entryPoints: ['lib/index.js'],
  platform: 'node',
  target: 'node14',
  bundle: true,
  outfile: 'dist/index.cjs',
  format: 'cjs',
  // got is a esm module, so we need to add it to the allowList, to include it in the bundle.
  plugins: [nodeExternalsPlugin({ allowList: ['got'] })]
}

build(buildConfig).then(() => { }).catch(() => { process.exit(1) })