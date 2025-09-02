// 文件格式检测和验证工具

export const detectFileType = (file) => {
  const extension = file.name.split('.').pop().toLowerCase()
  
  const typeMap = {
    'txt': 'txt',
    'pdf': 'pdf',
    'doc': 'doc',
    'docx': 'docx',
    'xls': 'xls',
    'xlsx': 'xlsx',
    'ppt': 'ppt',
    'pptx': 'pptx',
    'rtf': 'rtf'
  }
  
  return typeMap[extension] || 'unknown'
}

export const validateFileSize = (file, maxSize = 10) => {
  const maxSizeBytes = maxSize * 1024 * 1024 // MB转字节
  return file.size <= maxSizeBytes
}

export const getSupportedFormats = () => [
  { type: 'txt', name: '文本文件', accept: '.txt' },
  { type: 'pdf', name: 'PDF文档', accept: '.pdf' },
  { type: 'doc', name: 'Word文档', accept: '.doc,.docx' },
  { type: 'xls', name: 'Excel表格', accept: '.xls,.xlsx' }
]

export const getMimeType = (fileType) => {
  const mimeMap = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  return mimeMap[fileType]
}

export const fileToArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

export const fileToText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'UTF-8')
  })
}