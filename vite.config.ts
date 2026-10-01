import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import webp from './plugins/vite-plugin-webp';
import responsive from './plugins/vite-plugin-responsive';
import inlineCss from './plugins/vite-plugin-inline-css';

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  server: {
    host: true
  },
  plugins: [
    {
      name: 'tailwind-css-guard',
      enforce: 'pre',
      load(id) {
        if (id.includes('svelte') && id.includes('lang.css')) {
          return ''; // Ignore the incorrect CSS module
        }
      }
    },
    figmaAssetResolver(),
    react(),
    tailwindcss(),
    svgr(),
    responsive(),
    webp(),
    inlineCss()
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Split vendors into separate, long-cacheable chunks
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/](gsap|@gsap)[\\/]/.test(id)) return 'gsap';
          if (/[\\/](embla-carousel|embla-carousel-react)[\\/]/.test(id)) return 'ui';
          // Dialog + scroll lock: let Rollup keep them with the lazy VideoDialog chunk
          if (/[\\/](@radix-ui|react-remove-scroll|react-remove-scroll-bar|react-style-singleton|use-callback-ref|use-sidecar|aria-hidden|get-nonce|detect-node-es|tslib)[\\/]/.test(id)) return;
          return 'vendor';
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
