import { build, context } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const srcDir = path.join(rootDir, 'src');
const publicDir = path.join(rootDir, 'public');
const isWatch = process.argv.includes('--watch');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function copyDir(fromDir, toDir, allowedExtensions = null) {
  ensureDir(toDir);

  const entries = fs.readdirSync(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    const fromPath = path.join(fromDir, entry.name);
    const toPath = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(fromPath, toPath, allowedExtensions);
      continue;
    }

    if (allowedExtensions && !allowedExtensions.has(path.extname(entry.name))) {
      continue;
    }

    ensureDir(path.dirname(toPath));
    fs.copyFileSync(fromPath, toPath);
  }
}

const buildOptions = {
  entryPoints: {
    background: path.join(srcDir, 'background.ts'),
    menu: path.join(srcDir, 'menu.ts'),
    consent: path.join(srcDir, 'consent.ts'),
    editor: path.join(srcDir, 'editor.ts')
  },
  outdir: distDir,
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'chrome120',
  sourcemap: false,
  minify: false,
  logLevel: 'info'
};

function copyStatic() {
  copyDir(publicDir, distDir);
  copyDir(srcDir, distDir, new Set(['.html', '.css']));
}

async function run() {
  cleanDir(distDir);
  copyStatic();

  if (isWatch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    console.log('Watching TypeScript changes...');
    console.log('Static files are not watched. Re-run build if HTML/CSS/manifest changed.');
    return;
  }

  await build(buildOptions);
  console.log('Build complete.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
