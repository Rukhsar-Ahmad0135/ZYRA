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
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-clerk': ['@clerk/react'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-ui': ['sonner', 'lucide-react'],
          // Admin chunk (loaded only when needed)
          admin: [
            './src/components/Admin/AdminLayout.jsx',
            './src/Pages/AdminHomePage.jsx',
            './src/components/Admin/UserManagment.jsx',
            './src/components/Admin/ProductManagement.jsx',
            './src/components/Admin/OrderManagement.jsx',
          ],
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
