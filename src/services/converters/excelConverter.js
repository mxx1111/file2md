import * as XLSX from 'xlsx'

export class ExcelConverter {
  static async convert(file) {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file)
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      const allSheets = []
      const metadata = {
        title: file.name.replace(/\.(xls|xlsx)$/i, ''),
        sheets: [],
        totalRows: 0,
        totalCells: 0,
        size: file.size
      }
      
      // 处理每个工作表
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName]
        const sheetData = this.processWorksheet(worksheet, sheetName)
        
        if (sheetData.rows.length > 0) {
          allSheets.push(sheetData)
          metadata.sheets.push({
            name: sheetName,
            rows: sheetData.rows.length,
            columns: sheetData.columns.length
          })
          metadata.totalRows += sheetData.rows.length
          metadata.totalCells += sheetData.rows.length * sheetData.columns.length
        }
      })
      
      const markdown = this.convertToMarkdown(allSheets, file.name, metadata)
      
      return {
        success: true,
        markdown,
        originalName: file.name,
        convertedAt: new Date().toISOString(),
        metadata
      }
    } catch (error) {
      return {
        success: false,
        error: `Excel转换失败: ${error.message}`,
        file: file.name
      }
    }
  }
  
  static fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }
  
  static processWorksheet(worksheet, sheetName) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    const rows = []
    const columns = []
    
    // 确定列标题
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col })
      const cell = worksheet[cellAddress]
      const columnName = cell ? this.getCellValue(cell) : `列${col + 1}`
      columns.push(columnName)
    }
    
    // 处理数据行
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData = []
      let hasData = false
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]
        const value = cell ? this.getCellValue(cell) : ''
        
        rowData.push(value)
        if (value !== '') hasData = true
      }
      
      if (hasData) {
        rows.push(rowData)
      }
    }
    
    return {
      name: sheetName,
      columns,
      rows,
      range: {
        startRow: range.s.r,
        endRow: range.e.r,
        startCol: range.s.c,
        endCol: range.e.c
      }
    }
  }
  
  static getCellValue(cell) {
    if (!cell) return ''
    
    switch (cell.t) {
      case 'n': // 数字
        return this.formatNumber(cell.v)
      case 's': // 字符串
      case 'str':
        return String(cell.v).trim()
      case 'b': // 布尔值
        return cell.v ? '是' : '否'
      case 'd': // 日期
        return this.formatDate(cell.v)
      case 'e': // 错误
        return `#错误: ${cell.v}`
      default:
        return String(cell.v || '').trim()
    }
  }
  
  static formatNumber(value) {
    if (Number.isInteger(value)) {
      return value.toString()
    } else {
      return Number(value).toFixed(2).replace(/\.?0+$/, '')
    }
  }
  
  static formatDate(value) {
    if (value instanceof Date) {
      return value.toLocaleDateString('zh-CN')
    }
    return value.toString()
  }
  
  static convertToMarkdown(sheets, filename, metadata) {
    let markdown = `# ${filename.replace(/\.(xls|xlsx)$/i, '')}\n\n`
    markdown += `> 📊 Excel文档转换 | ${metadata.sheets.length} 个工作表 | `
    markdown += `${metadata.totalRows} 行数据 | 转换时间: ${new Date().toLocaleString()}\n\n`
    
    // 添加工作表概览
    if (sheets.length > 1) {
      markdown += '## 工作表概览\n\n'
      sheets.forEach(sheet => {
        markdown += `- **${sheet.name}**: ${sheet.rows.length} 行 × ${sheet.columns.length} 列\n`
      })
      markdown += '\n'
    }
    
    // 转换每个工作表
    sheets.forEach((sheet, index) => {
      if (sheets.length > 1) {
        markdown += `## ${sheet.name}\n\n`
      }
      
      markdown += this.convertTableToMarkdown(sheet)
      
      // 添加统计信息
      if (sheet.rows.length > 10) {
        markdown += `\n> 📈 数据统计: 共 ${sheet.rows.length} 行数据\n\n`
      }
    })
    
    return markdown
  }
  
  static convertTableToMarkdown(sheet) {
    if (sheet.rows.length === 0) {
      return '> 此工作表无数据\n\n'
    }
    
    let markdown = ''
    const maxRows = Math.min(sheet.rows.length, 1000) // 限制最大行数
    
    // 处理表头
    const headers = sheet.rows[0]
    markdown += '| ' + headers.map(header => 
      this.escapeMarkdownTableCell(header || '列')
    ).join(' | ') + ' |\n'
    
    // 添加分隔线
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n'
    
    // 处理数据行
    for (let i = 1; i < maxRows; i++) {
      const row = sheet.rows[i]
      if (row && row.some(cell => cell !== '')) {
        markdown += '| ' + row.map(cell => 
          this.escapeMarkdownTableCell(cell || '')
        ).join(' | ') + ' |\n'
      }
    }
    
    // 如果数据被截断，添加提示
    if (sheet.rows.length > maxRows) {
      markdown += `\n> ⚠️ 数据较多，仅显示前 ${maxRows} 行，完整数据请查看原始Excel文件\n`
    }
    
    return markdown + '\n'
  }
  
  static escapeMarkdownTableCell(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    
    return value
      .replace(/\|/g, '\\|') // 转义管道符
      .replace(/\n/g, '<br>') // 换行转换为HTML
      .replace(/^\s+|\s+$/g, '') // 去除首尾空格
      .substring(0, 100) // 限制单元格长度
  }
}