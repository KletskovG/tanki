import { spawnSync } from 'node:child_process';
import { access, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { clientDirectory, publicDirectory } from './paths.mjs';
import { playerGlobal } from './setup-as3.mjs';

const require = createRequire(import.meta.url);
const sdkDirectory = join(
    dirname(require.resolve('@apache-royale/royale-js/package.json')),
    'royale-asjs',
);
const compiler = join(sdkDirectory, 'js/lib/mxmlc.jar');
const java = process.env.JAVA_HOME
    ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
    : 'java';

await access(compiler);
await access(playerGlobal);
await mkdir(publicDirectory, { recursive: true });

const result = spawnSync(
    java,
    [
        '-Xmx512m',
        '-jar',
        compiler,
        '-targets=SWF',
        `-load-config=${join(clientDirectory, 'tools/as3-config.xml')}`,
        `-external-library-path=${playerGlobal}`,
        `-source-path=${join(clientDirectory, 'src/game')}`,
        '-target-player=32.0',
        '-swf-version=43',
        '-strict=true',
        '-debug=false',
        '-optimize=true',
        '-omit-trace-statements=false',
        `-output=${join(publicDirectory, 'game.swf')}`,
        join(clientDirectory, 'src/game/Main.as'),
    ],
    { cwd: clientDirectory, stdio: 'inherit' },
);

if (result.error) {
    throw new Error('Cannot run the AS3 compiler. Install Java 17+ and check JAVA_HOME/PATH.', {
        cause: result.error,
    });
}

if (result.status !== 0) {
    throw new Error(`AS3 compilation failed (${result.signal ?? result.status}).`);
}
