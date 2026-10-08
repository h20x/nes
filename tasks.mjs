import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TASKS = new Map([
  ['dist', dist],
  ['dev', dev],
  ['serve', serve],
  ['clean', clean],
]);

const OUTDIR = 'dist';

runTask();

function runTask() {
  const taskName = process.argv[2] || 'dist';

  if (TASKS.has(taskName)) {
    TASKS.get(taskName)();
  } else {
    console.log(`Task "${taskName}" not found`);
  }
}

async function dist() {
  await esbuild.build(getConfig());
}

async function dev() {
  const ctx = await esbuild.context(getConfig(true));
  const { port } = await ctx.serve({
    servedir: OUTDIR,
    onRequest: ({ remoteAddress, method, path, status, timeInMS }) => {
      console.log(
        `${remoteAddress} - "${method} ${path}" ${status} [${timeInMS}ms]`
      );
    },
  });

  console.log(`http://localhost:${port}\n`);
}

async function serve() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let file = req.url === '/' ? '/index.html' : req.url;

    file = path.join(process.cwd(), 'dist', file);

    try {
      const data = fs.readFileSync(file);
      const ext = path.extname(file).toLowerCase();
      const mime = mimeTypes[ext] ?? 'application/octet-stream';

      res.setHeader('Content-Type', mime);
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(9000, () => {
    console.log('http://localhost:9000');
  });
}

function clean() {
  const dir = path.join(process.cwd(), `/${OUTDIR}`);

  fs.rmSync(dir, {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(dir);
}

function getConfig(dev = false) {
  return {
    entryPoints: [{ out: 'app', in: 'src/app/app.ts' }],
    bundle: true,
    minify: !dev,
    outdir: OUTDIR,
    plugins: [
      copy({
        assets: [
          {
            from: ['./src/app/index.html'],
            to: [OUTDIR],
          },
          {
            from: ['./src/app/favicon.ico'],
            to: [OUTDIR],
          },
        ],
        resolveFrom: 'cwd',
        watch: dev,
      }),
    ],
  };
}
