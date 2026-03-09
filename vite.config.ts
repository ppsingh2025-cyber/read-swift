import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Served at the root of the readswift.techscript.ca subdomain
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'PaceRead — Read Faster',
        short_name: 'PaceRead',
        description: 'PaceRead: RSVP speed reader. Read Faster. Understand Better. PDF, EPUB, DOCX, TXT, MD, HTML, RTF, SRT at 60–1500 WPM. Intelligent chunking, offline-first. Free, no ads, no tracking.',
        theme_color: '#060606',
        background_color: '#060606',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache the app shell
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Don't cache the heavy PDF worker (it changes between builds)
        globIgnores: ['**/pdf.worker*'],
      },
    }),
  ],
  // localforage@1.10.0 ships dist/localforage.js in its package.json "main"
  // but this version's dist only contains localforage.min.js, causing Rollup
  // to fail. Pin to the .min.js until localforage publishes a fixed release.
  // If you upgrade localforage, verify the alias is still needed.
  resolve: {
    alias: {
      localforage: resolve(
        __dirname,
        'node_modules/localforage/dist/localforage.min.js',
      ),
    },
  },
  optimizeDeps: {
    // Pre-bundle pdfjs-dist to avoid ESM resolution issues
    // localforage is a dep of vite-plugin-pwa/workbox – needs explicit bundling
    include: ['pdfjs-dist', 'localforage'],
  },
  worker: {
    format: 'es',
  },
})
