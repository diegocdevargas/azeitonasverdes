import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite';

/**
 * Responsive WebP variants generated at build time.
 *
 * - JS: `import hero from "./a.jpg?responsive"` (or `?responsive&w=64;128`)
 *   → `{ src, srcset, width, height }`; src is the largest variant.
 * - HTML: `<img data-responsive="src/assets/a.jpg" sizes="100vw" ...>` gets
 *   src/srcset/width/height filled in. Add `fetchpriority="high"` and a matching
 *   `<link rel="preload" as="image">` is injected into <head>.
 *
 * Variants are emitted as assets/<name>-<w>w-<hash>.webp (content hashed, so
 * they can be cached forever). Dev serves the untouched original.
 */

const DEFAULT_WIDTHS = [480, 768, 1200, 1920];
const QUALITY = 75;
const HTML_IMG = /<img\b[^>]*\bdata-responsive="([^"]+)"[^>]*>/g;

type Responsive = { src: string; srcset: string; width: number; height: number };
type Variant = { fileName: string; width: number; source: Buffer };

const parseWidths = (value: string | null | undefined) =>
  value ? value.split(/[;,]/).map(Number).filter((n) => n > 0) : DEFAULT_WIDTHS;

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

export default function responsive(): Plugin {
  let config: ResolvedConfig;
  const cache = new Map<string, Promise<{ meta: { width: number; height: number }; variants: Variant[] }>>();
  const htmlImages = new Map<string, Responsive>();
  let emitted = new Set<string>();

  const isBuild = () => config.command === 'build';

  function generate(file: string, widths: number[]) {
    const key = `${file}|${widths.join(';')}`;
    if (!cache.has(key)) {
      cache.set(
        key,
        (async () => {
          const meta = await sharp(file).metadata();
          const width = meta.width!;
          const height = meta.height!;
          const max = Math.max(...widths);
          const targets = widths.filter((w) => w < width);
          if (width <= max && !targets.includes(width)) targets.push(width);
          const base = path.basename(file).replace(/\.[^.]+$/, '');
          const variants = await Promise.all(
            targets.map(async (w) => {
              const source = await sharp(file).resize({ width: w }).webp({ quality: QUALITY, effort: 6 }).toBuffer();
              const hash = crypto.createHash('sha256').update(source).digest('hex').slice(0, 8);
              return { fileName: `assets/${base}-${w}w-${hash}.webp`, width: w, source };
            }),
          );
          return { meta: { width, height }, variants };
        })(),
      );
    }
    return cache.get(key)!;
  }

  // Build: emit variants and describe them. Dev: point at the original file.
  async function describe(
    file: string,
    widths: number[],
    emit?: (v: Variant) => void,
  ): Promise<Responsive> {
    if (!isBuild()) {
      const meta = await sharp(file).metadata();
      const src = `/${path.relative(config.root, file).split(path.sep).join('/')}`;
      return { src, srcset: `${src} ${meta.width}w`, width: meta.width!, height: meta.height! };
    }
    const { meta, variants } = await generate(file, widths);
    variants.forEach((v) => emit?.(v));
    const url = (v: Variant) => config.base + v.fileName;
    const largest = variants[variants.length - 1];
    return {
      src: url(largest),
      srcset: variants.map((v) => `${url(v)} ${v.width}w`).join(', '),
      // Report the largest variant's box so width/height keep the right aspect ratio
      width: largest.width,
      height: Math.round((meta.height * largest.width) / meta.width),
    };
  }

  return {
    name: 'responsive-images',
    enforce: 'pre',

    configResolved(resolved) {
      config = resolved;
    },

    async buildStart() {
      emitted = new Set();
      htmlImages.clear();
      const htmlFile = path.resolve(config.root, 'index.html');
      if (!fs.existsSync(htmlFile)) return;
      const html = fs.readFileSync(htmlFile, 'utf8');
      for (const [tag, rel] of html.matchAll(HTML_IMG)) {
        const file = path.resolve(config.root, rel.replace(/^\//, ''));
        const info = await describe(file, parseWidths(attr(tag, 'data-widths')), (v) => {
          if (emitted.has(v.fileName)) return;
          emitted.add(v.fileName);
          this.emitFile({ type: 'asset', fileName: v.fileName, source: v.source });
        });
        htmlImages.set(rel, info);
      }
    },

    async load(id) {
      const [file, query] = id.split('?');
      if (query === undefined) return;
      const params = new URLSearchParams(query);
      if (!params.has('responsive')) return;
      this.addWatchFile(file);
      const info = await describe(file, parseWidths(params.get('w')), (v) => {
        if (emitted.has(v.fileName)) return;
        emitted.add(v.fileName);
        this.emitFile({ type: 'asset', fileName: v.fileName, source: v.source });
      });
      return `export default ${JSON.stringify(info)};`;
    },

    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        const tags: HtmlTagDescriptor[] = [];
        const out = [];
        let last = 0;
        for (const match of html.matchAll(HTML_IMG)) {
          const [tag, rel] = match;
          const info =
            htmlImages.get(rel) ??
            (await describe(path.resolve(config.root, rel.replace(/^\//, '')), parseWidths(attr(tag, 'data-widths'))));
          const sizes = attr(tag, 'sizes') ?? '100vw';
          let next = tag
            .replace(/\s+data-responsive="[^"]*"/, '')
            .replace(/\s+data-widths="[^"]*"/, '')
            .replace(/<img\b/, `<img src="${info.src}" srcset="${info.srcset}"`);
          if (!attr(tag, 'sizes')) next = next.replace(/<img\b/, `<img sizes="${sizes}"`);
          if (!attr(tag, 'width')) next = next.replace(/<img\b/, `<img width="${info.width}" height="${info.height}"`);
          out.push(html.slice(last, match.index), next);
          last = match.index! + tag.length;

          if (attr(tag, 'fetchpriority') === 'high') {
            tags.push({
              tag: 'link',
              attrs: { rel: 'preload', as: 'image', imagesrcset: info.srcset, imagesizes: sizes, fetchpriority: 'high' },
              injectTo: 'head',
            });
          }
        }
        out.push(html.slice(last));
        return { html: out.join(''), tags };
      },
    },
  };
}
