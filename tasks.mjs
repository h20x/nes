import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import fs from 'fs';
import path from 'path';

const TASKS = new Map([
  ['dist', dist],
  ['dev', () => serve(true)],
  ['serve', serve],
]);

runTask();

function runTask() {
  const taskName = process.argv[2] || 'dist';

  if (TASKS.has(taskName)) {
    TASKS.get(taskName)();
  } else {
    console.log(`Task "${taskName}" not found`);
  }
}

function getConfig(dev = false) {
  const dir = dev ? 'build' : 'dist';

  return {
    entryPoints: [
      { out: 'app', in: 'src/app/app.ts' },
      { out: 'audio-processor', in: 'src/console/apu/audio-processor.js' },
    ],
    define: { DEV: String(dev) },
    bundle: true,
    minify: !dev,
    outdir: dir,
    plugins: [
      copy({
        assets: [
          {
            from: ['./src/app/index.html'],
            to: [dir],
          },
          {
            from: ['./src/app/favicon.ico'],
            to: [dir],
          },
        ],
        resolveFrom: 'cwd',
        watch: dev,
      }),
    ],
  };
}

async function serve(dev = false) {
  const conf = getConfig(dev);
  clean(conf.outdir);
  const ctx = await esbuild.context(conf);
  const { port } = await ctx.serve({
    servedir: conf.outdir,
    onRequest: ({ remoteAddress, method, path, status, timeInMS }) => {
      console.log(
        `${remoteAddress} - "${method} ${path}" ${status} [${timeInMS}ms]`
      );
    },
  });

  console.log(`Serve 127.0.0.1:${port}\n`);
}

async function dist() {
  clean();
  await esbuild.build(getConfig());
}

function clean(dir = 'dist') {
  fs.rmdirSync(path.join(process.cwd(), `/${dir}`), {
    recursive: true,
    force: true,
  });
}
