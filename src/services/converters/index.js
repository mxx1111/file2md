import { TxtConverter } from './txtConverter'
import { PdfConverter } from './pdfConverter'
import { DocConverter } from './docConverter'
import { ExcelConverter } from './excelConverter'

export class ConverterFactory {
  static getConverter(fileType) {
    const converters = {
      'txt': TxtConverter,
      'pdf': PdfConverter,
      'doc': DocConverter,
      'docx': DocConverter,
      'xls': ExcelConverter,
      'xlsx': ExcelConverter
    }
    
    return converters[fileType]
  }
  
  static async convert(file, fileType) {
    const converter = this.getConverter(fileType)
    
    if (!converter) {
      throw new Error(`不支持的文件格式: ${fileType}`)
    }
    
    return await converter.convert(file)
  }
  
  static getSupportedTypes() {
    return ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
  }
  
  static getFileTypeInfo() {
    return {
      'txt': { name: '文本文件', status: 'stable', quality: 'high' },
      'pdf': { name: 'PDF文档', status: 'stable', quality: 'high' },
      'doc': { name: 'Word文档(旧版)', status: 'stable', quality: 'high' },
      'docx': { name: 'Word文档', status: 'stable', quality: 'high' },
      'xls': { name: 'Excel表格(旧版)', status: 'stable', quality: 'high' },
      'xlsx': { name: 'Excel表格', status: 'stable', quality: 'high' }
    }
  }
}