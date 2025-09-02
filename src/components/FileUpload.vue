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
      <el-icon class="el-icon--upload" :size="50"><upload-filled /></el-icon>
      <div class="el-upload__text">
        拖拽文件到此处或 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支持格式: .txt, .pdf, .doc, .docx, .xls, .xlsx
        </div>
      </template>
    </el-upload>
    
    <div class="file-list" v-if="fileList.length">
      <h3>待转换文件</h3>
      <div class="file-item" v-for="file in fileList" :key="file.uid">
        <el-icon><document /></el-icon>
        <span class="file-name">{{ file.name }}</span>
        <el-tag :type="getFileTypeTag(file.type)" size="small">{{ file.type }}</el-tag>
        <el-button @click="removeFile(file.uid)" type="danger" size="small" circle>
          <el-icon><close /></el-icon>
        </el-button>
      </div>
    </div>
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
const acceptedFormats = ref('.txt,.pdf,.doc,.docx,.xls,.xlsx')

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
    'xlsx': 'success'
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
  margin-bottom: 20px;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 40px;
  transition: all 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.el-icon--upload {
  color: #409eff;
  margin-bottom: 16px;
}

.file-list {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.file-list h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.file-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>