<template>
  <div class="main-view">
    <el-container>
      <el-header>
        <h1>文件转Markdown转换器</h1>
        <p class="subtitle">支持 TXT、PDF、Word、Excel 等多种格式</p>
      </el-header>
      
      <el-main>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>上传文件</span>
              </template>
              <FileUpload 
                ref="fileUploadRef"
                @file-change="handleFileChange"
              />
              
              <div class="conversion-controls" v-if="selectedFiles.length > 0">
                <el-button 
                  type="primary" 
                  size="large"
                  @click="startConversion"
                  :loading="isConverting"
                  :disabled="isConverting"
                >
                  {{ isConverting ? '转换中...' : `开始转换 (${selectedFiles.length}个文件)` }}
                </el-button>
                
                <el-button @click="clearAll" :disabled="isConverting">清空</el-button>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="16">
            <div v-if="convertedResults.length === 0" class="empty-state">
              <el-empty description="请选择文件开始转换">
                <el-button type="primary" @click="scrollToUpload">选择文件</el-button>
              </el-empty>
            </div>
            
            <div v-else class="results-section">
              <el-tabs v-model="activeTab" type="card">
                <el-tab-pane 
                  v-for="(result, index) in convertedResults" 
                  :key="index"
                  :label="result.originalName"
                  :name="`tab-${index}`"
                >
                  <el-alert 
                    v-if="result.warnings && result.warnings.length > 0"
                    title="转换警告"
                    type="warning"
                    :description="result.warnings.join('；')"
                    show-icon
                    closable
                    style="margin-bottom: 16px"
                  />
                  
                  <MarkdownPreview
                    :content="result.markdown"
                    :title="result.originalName"
                    :editable="true"
                    @content-change="(content) => handleContentChange(index, content)"
                  />
                </el-tab-pane>
              </el-tabs>
              
              <div class="batch-actions" v-if="convertedResults.length > 1">
                <el-button @click="downloadAll">批量下载所有文件</el-button>
                <el-button @click="clearResults">清空结果</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
    
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
.main-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.el-header {
  background: white;
  text-align: center;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.el-header h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
}

.subtitle {
  margin: 8px 0 0 0;
  color: #606266;
  font-size: 14px;
}

.el-main {
  padding: 20px;
}

.conversion-controls {
  margin-top: 20px;
  text-align: center;
}

.conversion-controls .el-button {
  margin: 0 8px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.results-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.batch-actions {
  margin-top: 20px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.progress-content {
  padding: 20px 0;
}

.progress-message {
  margin: 16px 0;
  text-align: center;
  color: #606266;
}

.progress-details {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  background: #f5f7fa;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 14px;
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
</style>