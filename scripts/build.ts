import { build, type BunPlugin } from 'bun';

// Ink optionally loads react-devtools-core (only when process.env.DEV === 'true').
// Since we're bundling for production, shim it out to keep the bundle lean.
const devtoolsShim: BunPlugin = {
  name: 'react-devtools-core-shim',
  setup(builder) {
    builder.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: 'react-devtools-core',
      namespace: 'shim',
    }));
    builder.onLoad({ filter: /.*/, namespace: 'shim' }, () => ({
      contents: 'export default { connectToDevTools() {} };',
      loader: 'js',
    }));
  },
};

const result = await build({
  entrypoints: ['cli/src/main.tsx'],
  outdir: 'dist/cli',
  target: 'node',
  format: 'esm',
  naming: 'main.js',
  plugins: [devtoolsShim],
});

if (!result.success) {
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log(`Built ${result.outputs.map((o) => o.path).join(', ')}`);
