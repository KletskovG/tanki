import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { clientDirectory } from './paths.mjs';

// Official Adobe API definitions; compile-time only, never shipped in dist.
const url = 'https://fpdownload.macromedia.com/get/flashplayer/updaters/32/playerglobal32_0.swc';
const expectedHash = '7d4d6168d27603cfb3b750302448e354e0bbc1bdd58f5d101c3dcf6891e9bb65';
export const playerGlobal = join(
    clientDirectory,
    '.generated/toolchain/playerglobal-32.0.swc',
);

let contents;
try {
    contents = await readFile(playerGlobal);
} catch (error) {
    if (error.code !== 'ENOENT') {
        throw error;
    }
}

const cached = contents !== undefined;
if (!contents) {
    console.log('Downloading Flash Player 32 API definitions from Adobe…');
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) {
        throw new Error(`Cannot download playerglobal.swc: HTTP ${response.status} (${url}).`);
    }
    contents = Buffer.from(await response.arrayBuffer());
}

if (createHash('sha256').update(contents).digest('hex') !== expectedHash) {
    throw new Error(`playerglobal.swc checksum mismatch. Remove ${playerGlobal} and rerun npm run setup:as3.`);
}

if (!cached) {
    await mkdir(dirname(playerGlobal), { recursive: true });
    await writeFile(playerGlobal, contents);
}

console.log('Flash Player 32 API definitions verified.');
