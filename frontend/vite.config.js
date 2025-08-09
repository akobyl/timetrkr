import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: '../static/dist',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/token': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Additional configurations for handling OPTIONS requests
          proxy.on('error', (err, req, res) => {
            console.warn('proxy error', err)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Remove content-length to allow proper form data handling
            if (req.method === 'POST') {
              proxyReq.removeHeader('Content-Length')
            }
          })
        },
      },
      '/users': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
