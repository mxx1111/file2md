import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'mammoth',
      'xlsx',
      'marked',
      'highlight.js',
      'file-saver'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'element-plus'],
          converters: ['mammoth', 'xlsx', 'pdfjs-dist'],
          utils: ['marked', 'highlight.js', 'file-saver']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})