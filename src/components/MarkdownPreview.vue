<template>
  <div class="markdown-preview-container">
    <div class="preview-header">
      <div class="header-left">
        <h3 class="preview-title">
          <span class="title-icon">📝</span>
          {{ title || '预览' }}
        </h3>
        <div class="preview-stats">
          <span class="stat-item" v-if="wordCount">
            <span class="stat-icon">📊</span>
            {{ wordCount }} 字
          </span>
          <span class="stat-item">
            <span class="stat-icon">⏱️</span>
            {{ readingTime }} 分钟阅读
          </span>
        </div>
      </div>
      <div class="header-right">
        <div class="view-mode-switcher">
          <button 
            class="mode-btn" 
            :class="{ active: viewMode === 'preview' }"
            @click="viewMode = 'preview'"
            title="预览模式"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 12S5 3 12 3s11 9 11 9-4 9-11 9S1 12 1 12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>预览</span>
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: viewMode === 'source' }"
            @click="viewMode = 'source'"
            title="源码模式"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="16 18 22 12 16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="8 6 2 12 8 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>源码</span>
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: viewMode === 'split' }"
            @click="viewMode = 'split'"
            title="对比模式"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>对比</span>
          </button>
        </div>
        
        <div class="export-dropdown">
          <el-dropdown @command="handleExport" trigger="click">
            <button class="export-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>导出</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="markdown">
                  <span class="dropdown-icon">📝</span> Markdown 文件
                </el-dropdown-item>
                <el-dropdown-item command="html">
                  <span class="dropdown-icon">🌐</span> HTML 文件
                </el-dropdown-item>
                <el-dropdown-item command="copy" divided>
                  <span class="dropdown-icon">📋</span> 复制到剪贴板
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
    
    <div class="preview-content" :class="viewMode">
      <!-- 纯预览模式 -->
      <div v-if="viewMode === 'preview'" class="preview-only">
        <div 
          ref="previewRef"
          class="markdown-body" 
          v-html="renderedHtml"
        ></div>
      </div>
      
      <!-- 纯源码模式 -->
      <div v-else-if="viewMode === 'source'" class="source-only">
        <el-input
          v-model="localContent"
          type="textarea"
          :rows="20"
          placeholder="Markdown源码"
          class="source-editor"
          @input="handleSourceChange"
        />
      </div>
      
      <!-- 分割对比模式 -->
      <div v-else-if="viewMode === 'split'" class="split-view">
        <div class="split-left">
          <h4>源码</h4>
          <el-input
            v-model="localContent"
            type="textarea"
            :rows="18"
            placeholder="Markdown源码"
            class="source-editor"
            @input="handleSourceChange"
          />
        </div>
        <div class="split-right">
          <h4>预览</h4>
          <div 
            class="markdown-body" 
            v-html="renderedHtml"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { saveAs } from 'file-saver'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  editable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:content', 'content-change'])

const viewMode = ref('preview')
const localContent = ref(props.content)
const previewRef = ref()

// 配置marked
marked.setOptions({
  breaks: true,
  gfm: true,
  tables: true,
  sanitize: false
})

// 渲染后的HTML
const renderedHtml = computed(() => {
  try {
    return marked.parse(localContent.value || '')
  } catch (error) {
    console.error('Markdown渲染失败:', error)
    return '<p class="error">Markdown渲染失败</p>'
  }
})

// 统计信息
const wordCount = computed(() => {
  return localContent.value.replace(/[^\u4e00-\u9fa5\w]/g, '').length
})

// 阅读时间估算（假设每分钟阅读 300 字）
const readingTime = computed(() => {
  return Math.max(1, Math.ceil(wordCount.value / 300))
})

// 监听内容变化
watch(() => props.content, (newContent) => {
  localContent.value = newContent
}, { immediate: true })

const handleSourceChange = (value) => {
  if (props.editable) {
    emit('update:content', value)
    emit('content-change', value)
  }
}

const handleExport = (command) => {
  const filename = props.title || '转换结果'
  
  switch (command) {
    case 'markdown':
      downloadAsMarkdown(localContent.value, filename)
      break
    case 'html':
      downloadAsHtml(renderedHtml.value, filename)
      break
    case 'copy':
      copyToClipboard(localContent.value)
      break
  }
}

const downloadAsMarkdown = (content, filename) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, `${filename}.md`)
  ElMessage.success('Markdown文件下载成功')
}

const downloadAsHtml = (htmlContent, filename) => {
  const fullHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <style>
        body { 
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .markdown-body {
            background-color: white;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        pre {
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow: auto;
        }
        code {
            background-color: rgba(175, 184, 193, 0.2);
            padding: 2px 4px;
            border-radius: 3px;
        }
        blockquote {
            border-left: 4px solid #dfe2e5;
            padding-left: 16px;
            margin: 0;
            color: #6a737d;
        }
    </style>
</head>
<body class="markdown-body">
    ${htmlContent}
</body>
</html>
  `
  
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
  saveAs(blob, `${filename}.html`)
  ElMessage.success('HTML文件下载成功')
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      ElMessage.success('已复制到剪贴板')
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    
    document.body.removeChild(textArea)
  }
}
</script>

<style scoped>
/* 容器样式 */
.markdown-preview-container {
  border-radius: 16px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.markdown-preview-container:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 头部样式 */
.preview-header {
  background: linear-gradient(135deg, #f8f9fb 0%, #ffffff 100%);
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.preview-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
}

.preview-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: rgba(255, 154, 86, 0.08);
  border-radius: 20px;
  font-size: 12px;
  color: #606266;
}

.stat-icon {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 视图模式切换器 */
.view-mode-switcher {
  display: flex;
  background: #f4f4f5;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s ease;
  outline: none;
}

.mode-btn:hover {
  background: rgba(255, 154, 86, 0.08);
  color: #ff9a56;
}

.mode-btn.active {
  background: white;
  color: #ff9a56;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.mode-btn span {
  font-weight: 500;
}

/* 导出按钮 */
.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  outline: none;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 154, 86, 0.4);
}

.dropdown-icon {
  font-size: 16px;
  margin-right: 4px;
}

/* 内容区域 */
.preview-content {
  min-height: 400px;
  max-height: 70vh;
  overflow-y: auto;
  background: white;
}

.preview-content::-webkit-scrollbar {
  width: 8px;
}

.preview-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ff8844 0%, #ff5555 100%);
}

.preview-only, .source-only {
  padding: 24px;
}

.split-view {
  display: flex;
  height: 600px;
}

.split-left, .split-right {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.split-left {
  border-right: 1px solid #e4e7ed;
  background: #fafbfc;
}

.split-right {
  background: white;
}

.split-left h4, .split-right h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}

.split-left h4::before {
  content: '📝';
}

.split-right h4::before {
  content: '👁️';
}

/* 源码编辑器 */
.source-editor :deep(.el-textarea__inner) {
  font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  background: #fafbfc;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  color: #303133;
}

.source-editor :deep(.el-textarea__inner):focus {
  border-color: #ff9a56;
  box-shadow: 0 0 0 3px rgba(255, 154, 86, 0.1);
}

/* Markdown 渲染样式 */
.markdown-body {
  font-size: 15px;
  line-height: 1.7;
  color: #24292e;
  word-wrap: break-word;
}

.markdown-body h1 {
  font-size: 2em;
  font-weight: 600;
  margin: 24px 0 16px;
  padding-bottom: 0.3em;
  border-bottom: 2px solid #e4e7ed;
  color: #1a202c;
}

.markdown-body h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin: 20px 0 12px;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #e4e7ed;
  color: #2d3748;
}

.markdown-body h3 {
  font-size: 1.25em;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #4a5568;
}

.markdown-body p {
  margin: 0 0 16px;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #e4e7ed;
  padding: 12px;
  text-align: left;
}

.markdown-body table th {
  background: linear-gradient(135deg, #fff9f5 0%, #fff5f0 100%);
  font-weight: 600;
  color: #303133;
}

.markdown-body table tr:nth-child(even) {
  background-color: #fffbf8;
}

.markdown-body table tr:hover {
  background-color: #fff5f0;
}

.markdown-body pre {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  color: #e2e8f0;
  padding: 20px;
  border-radius: 12px;
  overflow: auto;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.markdown-body code {
  background: linear-gradient(135deg, rgba(255, 154, 86, 0.1), rgba(255, 107, 107, 0.1));
  color: #ff7a45;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'JetBrains Mono', 'Monaco', monospace;
}

.markdown-body pre code {
  background: transparent;
  color: inherit;
  padding: 0;
}

.markdown-body blockquote {
  border-left: 4px solid #ff9a56;
  padding: 12px 20px;
  margin: 16px 0;
  background: linear-gradient(90deg, rgba(255, 154, 86, 0.05) 0%, transparent 100%);
  border-radius: 0 8px 8px 0;
  color: #4a5568;
  font-style: italic;
}

.markdown-body ul, .markdown-body ol {
  padding-left: 24px;
  margin: 16px 0;
}

.markdown-body li {
  margin: 8px 0;
}

.markdown-body a {
  color: #ff9a56;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.markdown-body a:hover {
  color: #ff6b6b;
  border-bottom-color: #ff6b6b;
}

.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 16px 0;
}

.markdown-body hr {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e4e7ed, transparent);
  margin: 24px 0;
}

/* 错误提示 */
.error {
  color: #f56c6c;
  padding: 20px;
  text-align: center;
  background: #fef0f0;
  border-radius: 8px;
  margin: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-right {
    justify-content: space-between;
  }
  
  .view-mode-switcher {
    flex: 1;
  }
  
  .mode-btn span {
    display: none;
  }
  
  .split-view {
    flex-direction: column;
    height: auto;
  }
  
  .split-left {
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }
}
</style>