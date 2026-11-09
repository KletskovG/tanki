import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { publicDirectory } from './paths.mjs';

const require = createRequire(import.meta.url);
const ruffleDirectory = dirname(require.resolve('@ruffle-rs/ruffle'));
const entries = await readdir(ruffleDirectory, { withFileTypes: true });
const runtimeFiles = entries.filter(
    (entry) =>
        entry.isFile() &&
    (entry.name.endsWith('.js') ||
      entry.name.endsWith('.wasm') ||
      entry.name.endsWith('.LICENSE.txt') ||
      entry.name.startsWith('LICENSE')),
);

if (
    !runtimeFiles.some((entry) => entry.name === 'ruffle.js') ||
  !runtimeFiles.some((entry) => entry.name.endsWith('.wasm'))
) {
    throw new Error('The installed Ruffle package is missing its runtime files.');
}

await rm(publicDirectory, { recursive: true, force: true });
await mkdir(publicDirectory, { recursive: true });

for (const entry of runtimeFiles) {
    await copyFile(
        join(ruffleDirectory, entry.name),
        join(publicDirectory, entry.name),
    );
}

console.log(`Copied ${runtimeFiles.length} Ruffle runtime/license files.`);
