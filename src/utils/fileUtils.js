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
    'rtf': 'rtf',
    'csv': 'csv',
    'tsv': 'tsv',
    'html': 'html',
    'htm': 'htm'
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
  { type: 'xls', name: 'Excel表格', accept: '.xls,.xlsx' },
  { type: 'csv', name: 'CSV表格', accept: '.csv,.tsv' },
  { type: 'html', name: 'HTML网页', accept: '.html,.htm' },
  { type: 'rtf', name: '富文本格式', accept: '.rtf' },
  { type: 'ppt', name: 'PowerPoint演示文稿', accept: '.ppt,.pptx' }
]

export const getMimeType = (fileType) => {
  const mimeMap = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'tsv': 'text/tab-separated-values',
    'html': 'text/html',
    'htm': 'text/html',
    'rtf': 'application/rtf',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
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