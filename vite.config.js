import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  // 设置基础路径为相对路径，这样可以部署到任何子目录
  base: './',
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