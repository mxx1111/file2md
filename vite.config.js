import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  // 设置基础路径，开发环境使用'/'，生产环境使用'./'
  base: process.env.NODE_ENV === 'production' ? './' : '/',
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
    ],
    // 排除pdfjs-dist的worker文件，避免被优化
    exclude: ['pdfjs-dist/build/pdf.worker.min.mjs']
  },
  build: {
    // 增加兼容性配置
    target: 'es2015',
    // 关闭文件大小警告
    chunkSizeWarningLimit: 1500,
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