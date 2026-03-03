import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import fs from 'fs';
import path from 'path';

const TASKS = new Map([
  ['default', build],
  ['dev', () => serve(true)],
  ['serve', serve],
]);

runTask();

function runTask() {
  const taskName = process.argv[2] || 'default';

  if (TASKS.has(taskName)) {
    TASKS.get(taskName)();
  } else {
    console.log(`Task "${taskName}" not found`);
  }
}

function getConfig(dev = false) {
  return {
    entryPoints: [
      { out: 'app', in: 'src/app/app.ts' },
      { out: 'audio-processor', in: 'src/console/apu/audio-processor.js' },
    ],
    define: { DEV: String(dev) },
    bundle: true,
    minify: !dev,
    outdir: 'dist',
    plugins: [
      copy({
        assets: [
          {
            from: ['./src/app/index.html'],
            to: ['./dist'],
          },
        ],
        resolveFrom: 'cwd',
        watch: dev,
      }),
    ],
  };
}

async function serve(dev = false) {
  clean();
  const ctx = await esbuild.context(getConfig(dev));
  const { port } = await ctx.serve({
    servedir: 'dist',
    onRequest: ({ remoteAddress, method, path, status, timeInMS }) => {
      console.log(
        `${remoteAddress} - "${method} ${path}" ${status} [${timeInMS}ms]`
      );
    },
  });

  console.log(`Serve 127.0.0.1:${port}\n`);
}

async function build() {
  clean();
  await esbuild.build(getConfig());
}

function clean() {
  fs.rmdirSync(path.join(process.cwd(), '/dist'), {
    recursive: true,
    force: true,
  });
}
