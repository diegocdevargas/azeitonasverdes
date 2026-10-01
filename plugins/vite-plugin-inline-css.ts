import type { OutputAsset } from 'rollup';
import type { Plugin } from 'vite';

/**
 * Build only: inline the entry stylesheet into index.html instead of linking it.
 *
 * The whole app is styled by one ~10 KB (gzipped) file, which fits in the first
 * round trip together with the HTML. Linking it costs an extra render-blocking
 * request before anything (including the static hero) can paint, while splitting
 * it into critical/async parts would flash unstyled content when React mounts.
 */
export default function inlineCss(): Plugin {
  return {
    name: 'inline-entry-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        return html.replace(/<link rel="stylesheet"[^>]*href="\/?([^"]+\.css)"[^>]*>/g, (tag, fileName) => {
          const asset = ctx.bundle![fileName] as OutputAsset | undefined;
          if (!asset || asset.type !== 'asset') return tag;
          return `<style>${String(asset.source).replace(/<\/style/gi, '<\\/style')}</style>`;
        });
      },
    },
  };
}
