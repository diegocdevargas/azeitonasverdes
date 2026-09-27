import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Plugin, ResolvedConfig } from 'vite';

/**
 * Converts raster images to WebP at build time — sources stay png/jpg,
 * generated .webp files only ever exist in dist/ (or in memory during dev).
 *
 * - `import x from "./a.png"` → x points to a hashed a-[hash].webp in the build
 *   (dev serves the original, so imports work unchanged in both modes).
 * - public/**\/*.png|jpg → a .webp sibling is written next to it in dist/.
 *   Reference public images by their .webp path; in dev the middleware
 *   converts the png/jpg original on the fly.
 */

const RASTER = /\.(png|jpe?g)$/i;
const SOURCE_EXTS = ['.png', '.jpg', '.jpeg'];

const toWebp = (input: string) =>
  sharp(input).webp({ quality: 80, effort: 6 }).toBuffer();

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export default function webp(): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'webp',
    enforce: 'pre',

    configResolved(resolved) {
      config = resolved;
    },

    // Build: imported png/jpg → emitted .webp asset
    async load(id) {
      if (config.command !== 'build') return;
      const [file, query] = id.split('?');
      if (query !== undefined || !RASTER.test(file)) return;

      const ref = this.emitFile({
        type: 'asset',
        name: path.basename(file).replace(RASTER, '.webp'),
        source: await toWebp(file),
      });
      return `export default import.meta.ROLLUP_FILE_URL_${ref};`;
    },

    // Build: public/ is copied verbatim, so add a .webp next to each png/jpg
    async writeBundle() {
      const { publicDir } = config;
      if (!publicDir || !config.build.copyPublicDir) return;
      const outDir = path.resolve(config.root, config.build.outDir);

      const sources = walk(publicDir).filter((f) => RASTER.test(f));
      await Promise.all(
        sources.map(async (src) => {
          const out = path.join(outDir, path.relative(publicDir, src)).replace(RASTER, '.webp');
          await fs.promises.mkdir(path.dirname(out), { recursive: true });
          await fs.promises.writeFile(out, await toWebp(src));
        }),
      );
      config.logger.info(`webp: converted ${sources.length} public images`);
    },

    // Dev: serve /foo.webp from public/foo.png|jpg, converted on the fly
    configureServer(server) {
      const cache = new Map<string, Buffer>();
      // Vite gives posix-style paths; normalise so startsWith works on Windows
      const publicDir = config.publicDir && path.resolve(config.publicDir);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (!publicDir || !url?.endsWith('.webp')) return next();

        const base = path.join(publicDir, decodeURIComponent(url)).slice(0, -'.webp'.length);
        if (!base.startsWith(publicDir) || fs.existsSync(`${base}.webp`)) return next();

        const src = SOURCE_EXTS.map((ext) => base + ext).find((f) => fs.existsSync(f));
        if (!src) return next();

        try {
          const key = `${src}:${fs.statSync(src).mtimeMs}`;
          if (!cache.has(key)) cache.set(key, await toWebp(src));
          res.setHeader('Content-Type', 'image/webp');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(cache.get(key));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
