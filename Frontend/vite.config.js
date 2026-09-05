import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (id.includes('@clerk')) return 'vendor-clerk';
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'vendor-redux';
            if (id.includes('sonner') || id.includes('lucide-react')) return 'vendor-ui';
          }
          if (id.includes('/src/components/Admin/') || id.includes('/src/Pages/AdminHomePage.jsx')) return 'admin';
        },
        // Cache busting with content hashes
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    // Minify JS
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Server config for SPA refresh
  server: {
    port: 3001,
    strictPort: true,
    host: true,
    // SPA fallback for refresh
    middlewareMode: false,
  },
  preview: {
    port: 3001,
    host: true,
  },
})
