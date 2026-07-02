import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function build() {
  const sharedOptions = {
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['electron'],
    sourcemap: true,
    tsconfig: path.join(root, 'tsconfig.node.json'),
    alias: {
      '@shared': path.join(root, 'src/shared'),
    },
  };

  await esbuild.build({
    ...sharedOptions,
    entryPoints: [path.join(root, 'src/main/index.ts')],
    outfile: path.join(root, 'dist/main/index.js'),
  });

  await esbuild.build({
    ...sharedOptions,
    entryPoints: [path.join(root, 'src/preload/index.ts')],
    outfile: path.join(root, 'dist/preload/index.js'),
  });

  console.log('Main and preload built successfully');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
