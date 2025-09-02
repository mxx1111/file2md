<template>
  <div class="file-upload">
    <el-upload
      ref="uploadRef"
      class="upload-area"
      drag
      multiple
      :show-file-list="false"
      :auto-upload="false"
      :accept="acceptedFormats"
      :on-change="handleFileChange"
      :before-upload="beforeUpload"
    >
      <div class="upload-content">
        <div class="upload-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15L12 3M12 3L8 7M12 3L16 7" stroke="url(#upload-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17" stroke="url(#upload-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="upload-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ff9a56;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ff6b6b;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="upload-text">
          <p class="main-text">拖拽文件到此处上传</p>
          <p class="sub-text">或者 <span class="click-text">点击选择文件</span></p>
        </div>
        <div class="supported-formats">
          <span class="format-badge">TXT</span>
          <span class="format-badge">PDF</span>
          <span class="format-badge">DOC/DOCX</span>
          <span class="format-badge">XLS/XLSX</span>
          <span class="format-badge">CSV/TSV</span>
          <span class="format-badge">HTML</span>
          <span class="format-badge">RTF</span>
          <span class="format-badge">PPT/PPTX</span>
        </div>
        <p class="size-limit">单个文件最大 10MB</p>
      </div>
    </el-upload>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Close } from '@element-plus/icons-vue'
import { detectFileType, validateFileSize } from '@/utils/fileUtils'

const emit = defineEmits(['file-change'])

const uploadRef = ref()
const fileList = ref([])
const acceptedFormats = ref('.txt,.pdf,.doc,.docx,.xls,.xlsx,.csv,.tsv,.html,.htm,.rtf,.ppt,.pptx')

const beforeUpload = (file) => {
  if (!validateFileSize(file)) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  return true
}

const handleFileChange = (file, files) => {
  const fileType = detectFileType(file.raw)
  
  if (fileType === 'unknown') {
    ElMessage.error(`不支持的文件格式: ${file.name}`)
    return false
  }
  
  if (!validateFileSize(file.raw)) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  
  file.type = fileType
  fileList.value.push(file)
  emit('file-change', fileList.value)
}

const removeFile = (uid) => {
  fileList.value = fileList.value.filter(file => file.uid !== uid)
  emit('file-change', fileList.value)
}

const getFileTypeTag = (type) => {
  const typeMap = {
    'txt': 'info',
    'pdf': 'warning',
    'doc': 'primary',
    'docx': 'primary',
    'xls': 'success',
    'xlsx': 'success',
    'csv': 'success',
    'tsv': 'success',
    'html': 'danger',
    'htm': 'danger',
    'rtf': '',
    'ppt': 'warning',
    'pptx': 'warning'
  }
  return typeMap[type] || 'info'
}

const clearFiles = () => {
  fileList.value = []
  emit('file-change', fileList.value)
}

defineExpose({
  clearFiles
})
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  border: 2px dashed #d9d9d9;
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #f8f9fb);
  transition: all 0.3s ease;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

.upload-area :deep(.el-upload-dragger::before) {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 154, 86, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #ff9a56;
  background: linear-gradient(145deg, #ffffff, #fff5f0);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 154, 86, 0.15);
}

.upload-area :deep(.el-upload-dragger:hover::before) {
  opacity: 1;
}

.upload-area :deep(.el-upload-dragger.is-dragover) {
  border-color: #ff6b6b;
  background: linear-gradient(145deg, #fff9f5, #fff5f0);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.upload-text {
  text-align: center;
}

.main-text {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 8px 0;
}

.sub-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.click-text {
  color: #ff9a56;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.click-text:hover {
  color: #ff6b6b;
  border-bottom-color: #ff6b6b;
}

.supported-formats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.format-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(255, 154, 86, 0.1), rgba(255, 107, 107, 0.1));
  border: 1px solid rgba(255, 154, 86, 0.2);
  border-radius: 20px;
  font-size: 12px;
  color: #ff9a56;
  font-weight: 500;
  transition: all 0.2s ease;
}

.format-badge:hover {
  background: linear-gradient(135deg, #ff9a56, #ff6b6b);
  color: white;
  transform: scale(1.05);
}

.size-limit {
  font-size: 12px;
  color: #c0c4cc;
  margin: 8px 0 0 0;
}

/* 文件列表样式（如果需要在组件内显示） */
.file-list {
  background: linear-gradient(145deg, #f8f9fb, #ffffff);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.file-list h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-list h3::before {
  content: '📁';
  font-size: 20px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.file-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #ff9a56;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-area :deep(.el-upload-dragger) {
    padding: 30px 15px;
  }
  
  .upload-icon svg {
    width: 60px;
    height: 60px;
  }
  
  .main-text {
    font-size: 16px;
  }
  
  .supported-formats {
    gap: 6px;
  }
  
  .format-badge {
    font-size: 11px;
    padding: 3px 8px;
  }
}
</style>