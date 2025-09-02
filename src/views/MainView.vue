<template>
  <div class="main-view">
    <!-- 优雅的顶部导航栏 -->
    <div class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="app-title">File2MD</h1>
        </div>
        <div class="header-subtitle">
          <span class="subtitle-text">轻松将文档转换为 Markdown 格式</span>
          <span class="version-badge">v1.0</span>
        </div>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="content-wrapper">
        <el-row :gutter="30">
          <!-- 左侧上传区域 -->
          <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8">
            <div class="upload-panel">
              <div class="panel-header">
                <div class="panel-title">
                  <span class="title-icon">📁</span>
                  <span>选择文件</span>
                </div>
                <el-tag type="info" size="small" effect="plain">
                  支持 TXT / PDF / DOC / XLS
                </el-tag>
              </div>
              
              <div class="upload-area">
                <FileUpload 
                  ref="fileUploadRef"
                  @file-change="handleFileChange"
                />
              </div>
              
              <!-- 文件列表显示 -->
              <transition name="slide-fade">
                <div class="file-list" v-if="selectedFiles.length > 0">
                  <div class="file-list-header">
                    <span>已选择 {{ selectedFiles.length }} 个文件</span>
                    <el-button text size="small" @click="clearFiles" :disabled="isConverting">
                      清空列表
                    </el-button>
                  </div>
                  <div class="file-items">
                    <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                      <span class="file-icon">📄</span>
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                  </div>
                </div>
              </transition>
              
              <!-- 转换按钮 -->
              <transition name="bounce">
                <div class="action-area" v-if="selectedFiles.length > 0">
                  <el-button 
                    class="convert-btn"
                    type="primary" 
                    size="large"
                    @click="startConversion"
                    :loading="isConverting"
                    :disabled="isConverting"
                  >
                    <span v-if="!isConverting">
                      <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L12 12M12 12L7 7M12 12L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 12 12)"/>
                        <path d="M12 22L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      开始转换
                    </span>
                    <span v-else>转换中...</span>
                  </el-button>
                </div>
              </transition>
            </div>
          </el-col>
          
          <!-- 右侧预览区域 -->
          <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="16">
            <!-- 空状态 -->
            <transition name="fade">
              <div v-if="convertedResults.length === 0" class="empty-preview">
                <div class="empty-content">
                  <div class="empty-icon">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="url(#gradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h3>准备就绪</h3>
                  <p>选择文件并点击转换，即可生成 Markdown 文档</p>
                  <div class="features">
                    <div class="feature-item">
                      <span class="feature-icon">✨</span>
                      <span>智能识别格式</span>
                    </div>
                    <div class="feature-item">
                      <span class="feature-icon">🚀</span>
                      <span>快速转换</span>
                    </div>
                    <div class="feature-item">
                      <span class="feature-icon">🔒</span>
                      <span>本地处理</span>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
            
            <!-- 转换结果展示 -->
            <transition name="fade">
              <div v-if="convertedResults.length > 0" class="preview-panel">
                <div class="preview-header">
                  <div class="tab-wrapper">
                    <div class="custom-tabs">
                      <div 
                        v-for="(result, index) in convertedResults" 
                        :key="index"
                        class="custom-tab"
                        :class="{ active: activeTab === `tab-${index}` }"
                        @click="activeTab = `tab-${index}`"
                      >
                        <span class="tab-icon">📝</span>
                        <span class="tab-name">{{ result.originalName }}</span>
                        <span class="tab-close" @click.stop="removeResult(index)">×</span>
                      </div>
                    </div>
                  </div>
                  <div class="preview-actions">
                    <el-button-group>
                      <el-button size="small" @click="downloadAll" v-if="convertedResults.length > 1">
                        <span class="action-icon">📦</span> 批量下载
                      </el-button>
                      <el-button size="small" @click="clearResults">
                        <span class="action-icon">🗑️</span> 清空
                      </el-button>
                    </el-button-group>
                  </div>
                </div>
                
                <div class="preview-content">
                  <div v-for="(result, index) in convertedResults" :key="index">
                    <div v-show="activeTab === `tab-${index}`" class="tab-content">
                      <el-alert 
                        v-if="result.warnings && result.warnings.length > 0"
                        title="转换提示"
                        type="warning"
                        :description="result.warnings.join('；')"
                        show-icon
                        closable
                        class="conversion-alert"
                      />
                      
                      <MarkdownPreview
                        :content="result.markdown"
                        :title="result.originalName"
                        :editable="true"
                        @content-change="(content) => handleContentChange(index, content)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </el-col>
        </el-row>
      </div>
    </div>
    
    <!-- 转换进度对话框 -->
    <el-dialog
      v-model="showProgress"
      title="转换进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="progress-content">
        <el-progress 
          :percentage="progressPercentage" 
          :status="progressStatus"
        />
        <p class="progress-message">{{ progressMessage }}</p>
        <div class="progress-details" v-if="conversionDetails.length > 0">
          <div 
            v-for="(detail, index) in conversionDetails" 
            :key="index"
            class="detail-item"
            :class="detail.status"
          >
            <el-icon v-if="detail.status === 'success'"><check /></el-icon>
            <el-icon v-else-if="detail.status === 'error'"><close /></el-icon>
            <el-icon v-else><loading /></el-icon>
            <span>{{ detail.message }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Check, Close, Loading } from '@element-plus/icons-vue'
import FileUpload from '@/components/FileUpload.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { ConverterFactory } from '@/services/converters'
import { detectFileType } from '@/utils/fileUtils'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

// 状态管理
const fileUploadRef = ref()
const selectedFiles = ref([])
const convertedResults = ref([])
const isConverting = ref(false)
const activeTab = ref('tab-0')

// 进度管理
const showProgress = ref(false)
const progressPercentage = ref(0)
const progressStatus = ref('')
const progressMessage = ref('')
const conversionDetails = ref([])

// 处理文件选择
const handleFileChange = (files) => {
  selectedFiles.value = files
}

// 开始转换
const startConversion = async () => {
  if (selectedFiles.value.length === 0) return
  
  isConverting.value = true
  showProgress.value = true
  progressPercentage.value = 0
  progressStatus.value = ''
  conversionDetails.value = []
  
  const totalFiles = selectedFiles.value.length
  const results = []
  
  for (let i = 0; i < totalFiles; i++) {
    const file = selectedFiles.value[i]
    const fileType = file.type || detectFileType(file.raw)
    
    progressPercentage.value = Math.round((i / totalFiles) * 100)
    progressMessage.value = `正在转换: ${file.name} (${i + 1}/${totalFiles})`
    
    conversionDetails.value.push({
      status: 'processing',
      message: `正在转换: ${file.name}`
    })
    
    try {
      const result = await ConverterFactory.convert(file.raw, fileType)
      
      if (result.success) {
        results.push(result)
        conversionDetails.value[conversionDetails.value.length - 1] = {
          status: 'success',
          message: `✓ ${file.name} 转换成功`
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('转换失败:', error)
      conversionDetails.value[conversionDetails.value.length - 1] = {
        status: 'error',
        message: `✗ ${file.name}: ${error.message}`
      }
      
      ElMessage.error(`${file.name} 转换失败: ${error.message}`)
    }
  }
  
  progressPercentage.value = 100
  progressStatus.value = 'success'
  progressMessage.value = `转换完成！成功 ${results.length}/${totalFiles} 个文件`
  
  if (results.length > 0) {
    convertedResults.value = [...convertedResults.value, ...results]
    activeTab.value = `tab-${convertedResults.value.length - results.length}`
    
    ElNotification({
      title: '转换完成',
      message: `成功转换 ${results.length} 个文件`,
      type: 'success',
      duration: 3000
    })
  }
  
  setTimeout(() => {
    showProgress.value = false
    isConverting.value = false
    clearFiles()
  }, 2000)
}

// 清空文件
const clearFiles = () => {
  selectedFiles.value = []
  if (fileUploadRef.value) {
    fileUploadRef.value.clearFiles()
  }
}

// 清空所有
const clearAll = () => {
  clearFiles()
  convertedResults.value = []
}

// 清空结果
const clearResults = () => {
  convertedResults.value = []
  activeTab.value = 'tab-0'
}

// 删除单个结果
const removeResult = (index) => {
  convertedResults.value.splice(index, 1)
  if (convertedResults.value.length > 0) {
    activeTab.value = `tab-0`
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 内容更改
const handleContentChange = (index, content) => {
  if (convertedResults.value[index]) {
    convertedResults.value[index].markdown = content
  }
}

// 批量下载
const downloadAll = async () => {
  if (convertedResults.value.length === 0) return
  
  const zip = new JSZip()
  
  convertedResults.value.forEach((result, index) => {
    const filename = result.originalName.replace(/\.[^/.]+$/, '') + '.md'
    zip.file(filename, result.markdown)
  })
  
  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, `转换结果_${new Date().toISOString().slice(0, 10)}.zip`)
  
  ElMessage.success('批量下载成功')
}

// 滚动到上传区域
const scrollToUpload = () => {
  const uploadElement = document.querySelector('.file-upload')
  if (uploadElement) {
    uploadElement.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
/* 全局样式 */
.main-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

.main-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  opacity: 0.95;
  z-index: 0;
}

/* 顶部导航栏 */
.app-header {
  position: relative;
  z-index: 10;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  padding: 24px 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.app-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-subtitle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subtitle-text {
  color: #606266;
  font-size: 14px;
}

.version-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

/* 主内容区域 */
.main-content {
  position: relative;
  z-index: 5;
  padding: 40px 24px;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* 上传面板 */
.upload-panel {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.upload-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.12);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.title-icon {
  font-size: 24px;
}

.upload-area {
  margin: 20px 0;
}

/* 文件列表 */
.file-list {
  background: #f8f9fb;
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.file-icon {
  font-size: 20px;
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 转换按钮 */
.action-area {
  margin-top: 24px;
  text-align: center;
}

.convert-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.convert-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  margin-right: 8px;
  vertical-align: middle;
}

/* 空状态预览 */
.empty-preview {
  background: white;
  border-radius: 20px;
  padding: 60px 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
}

.empty-icon {
  margin: 0 auto 30px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.empty-content h3 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 12px 0;
}

.empty-content p {
  color: #909399;
  font-size: 14px;
  margin: 0 0 40px 0;
}

.features {
  display: flex;
  gap: 30px;
  justify-content: center;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #f8f9fb;
  border-radius: 20px;
  font-size: 14px;
  color: #606266;
}

.feature-icon {
  font-size: 18px;
}

/* 预览面板 */
.preview-panel {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.preview-header {
  background: #f8f9fb;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-wrapper {
  flex: 1;
  overflow-x: auto;
}

.custom-tabs {
  display: flex;
  gap: 8px;
}

.custom-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  white-space: nowrap;
}

.custom-tab:hover {
  background: #f0f2ff;
}

.custom-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-icon {
  font-size: 16px;
}

.tab-name {
  font-size: 14px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  font-size: 18px;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.tab-close:hover {
  opacity: 1;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.action-icon {
  margin-right: 4px;
}

.preview-content {
  padding: 24px;
  min-height: 500px;
}

.conversion-alert {
  margin-bottom: 20px;
  border-radius: 8px;
}

/* 进度对话框 */
.progress-content {
  padding: 20px 0;
}

.progress-message {
  margin: 16px 0;
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.progress-details {
  max-height: 300px;
  overflow-y: auto;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px;
  background: #f8f9fb;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  transition: all 0.2s ease;
}

.detail-item.success {
  color: #67c23a;
}

.detail-item.error {
  color: #f56c6c;
}

.detail-item.processing {
  color: #409eff;
}

/* 动画效果 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-out 0.3s;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .features {
    flex-direction: column;
    gap: 12px;
  }
  
  .custom-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
  
  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>