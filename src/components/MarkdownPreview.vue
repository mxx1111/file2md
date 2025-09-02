<template>
  <div class="markdown-preview-container">
    <div class="preview-header">
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <h3>{{ title || '预览' }}</h3>
          <el-tag v-if="wordCount" size="small">{{ wordCount }} 字</el-tag>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button-group>
            <el-button 
              :type="viewMode === 'preview' ? 'primary' : ''" 
              @click="viewMode = 'preview'"
              size="small"
            >
              预览
            </el-button>
            <el-button 
              :type="viewMode === 'source' ? 'primary' : ''" 
              @click="viewMode = 'source'"
              size="small"
            >
              源码
            </el-button>
            <el-button 
              :type="viewMode === 'split' ? 'primary' : ''" 
              @click="viewMode = 'split'"
              size="small"
            >
              对比
            </el-button>
          </el-button-group>
          
          <el-dropdown @command="handleExport" style="margin-left: 8px">
            <el-button type="primary" size="small">
              下载 <el-icon><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="markdown">Markdown文件</el-dropdown-item>
                <el-dropdown-item command="html">HTML文件</el-dropdown-item>
                <el-dropdown-item command="copy">复制到剪贴板</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-col>
      </el-row>
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
.markdown-preview-container {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  overflow: hidden;
}

.preview-header {
  background: #f6f8fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e4e8;
}

.preview-header h3 {
  margin: 0;
  display: inline-block;
  margin-right: 8px;
}

.preview-content {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.preview-only, .source-only {
  padding: 16px;
}

.split-view {
  display: flex;
  height: 600px;
}

.split-left, .split-right {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.split-left {
  border-right: 1px solid #e1e4e8;
}

.split-left h4, .split-right h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.source-editor :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  color: #24292e;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.markdown-body table th {
  background-color: #f6f8fa;
  font-weight: 600;
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.markdown-body pre {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
}

.markdown-body code {
  background-color: rgba(27, 31, 35, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 85%;
}

.markdown-body blockquote {
  border-left: 4px solid #dfe2e5;
  padding: 0 1em;
  color: #6a737d;
  margin: 0;
}

.error {
  color: #f56c6c;
  padding: 16px;
  text-align: center;
}
</style>