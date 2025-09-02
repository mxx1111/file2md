import { TxtConverter } from './txtConverter'
import { PdfConverter } from './pdfConverter'
import { DocConverter } from './docConverter'
import { ExcelConverter } from './excelConverter'
import { CsvConverter } from './csvConverter'
import { HtmlConverter } from './htmlConverter'
import { RtfConverter } from './rtfConverter'
import { PptConverter } from './pptConverter'

export class ConverterFactory {
  static getConverter(fileType) {
    const converters = {
      'txt': TxtConverter,
      'pdf': PdfConverter,
      'doc': DocConverter,
      'docx': DocConverter,
      'xls': ExcelConverter,
      'xlsx': ExcelConverter,
      'csv': CsvConverter,
      'tsv': CsvConverter,
      'html': HtmlConverter,
      'htm': HtmlConverter,
      'rtf': RtfConverter,
      'ppt': PptConverter,
      'pptx': PptConverter
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
    return ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'tsv', 'html', 'htm', 'rtf', 'ppt', 'pptx']
  }
  
  static getFileTypeInfo() {
    return {
      'txt': { name: '文本文件', status: 'stable', quality: 'high' },
      'pdf': { name: 'PDF文档', status: 'stable', quality: 'high' },
      'doc': { name: 'Word文档(旧版)', status: 'stable', quality: 'high' },
      'docx': { name: 'Word文档', status: 'stable', quality: 'high' },
      'xls': { name: 'Excel表格(旧版)', status: 'stable', quality: 'high' },
      'xlsx': { name: 'Excel表格', status: 'stable', quality: 'high' },
      'csv': { name: 'CSV表格', status: 'stable', quality: 'high' },
      'tsv': { name: 'TSV表格', status: 'stable', quality: 'high' },
      'html': { name: 'HTML网页', status: 'stable', quality: 'high' },
      'htm': { name: 'HTML网页', status: 'stable', quality: 'high' },
      'rtf': { name: '富文本格式', status: 'stable', quality: 'medium' },
      'ppt': { name: 'PowerPoint(旧版)', status: 'beta', quality: 'low' },
      'pptx': { name: 'PowerPoint演示文稿', status: 'stable', quality: 'medium' }
    }
  }
}