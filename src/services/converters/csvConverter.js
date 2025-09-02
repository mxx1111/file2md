import Papa from 'papaparse'

export class CsvConverter {
  static async convert(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const csvText = e.target.result
          const fileExtension = file.name.split('.').pop().toLowerCase()
          
          // 根据文件扩展名确定分隔符
          const delimiter = fileExtension === 'tsv' ? '\t' : ','
          
          // 使用 PapaParse 解析 CSV/TSV
          const results = Papa.parse(csvText, {
            delimiter: delimiter,
            header: false,
            skipEmptyLines: true,
            dynamicTyping: true
          })
          
          if (results.errors.length > 0) {
            console.warn('CSV 解析警告:', results.errors)
          }
          
          const markdown = this.convertToMarkdown(results.data, file.name)
          
          resolve({
            success: true,
            markdown,
            originalName: file.name,
            convertedAt: new Date().toISOString(),
            metadata: {
              rows: results.data.length,
              columns: results.data[0]?.length || 0,
              delimiter: delimiter === '\t' ? 'Tab' : 'Comma'
            }
          })
        } catch (error) {
          reject({
            success: false,
            error: `CSV/TSV 转换失败: ${error.message}`
          })
        }
      }
      
      reader.onerror = () => {
        reject({
          success: false,
          error: '文件读取失败'
        })
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }
  
  static convertToMarkdown(data, filename) {
    if (!data || data.length === 0) {
      return `# ${filename.replace(/\.(csv|tsv)$/i, '')}\n\n*空文件*`
    }
    
    let markdown = `# ${filename.replace(/\.(csv|tsv)$/i, '')}\n\n`
    
    // 检查是否所有行的列数相同
    const firstRowLength = data[0].length
    const isTable = data.every(row => row.length === firstRowLength)
    
    if (isTable && data.length > 1) {
      // 作为表格处理
      markdown += this.createMarkdownTable(data)
    } else {
      // 作为列表处理
      markdown += this.createMarkdownList(data)
    }
    
    return markdown
  }
  
  static createMarkdownTable(data) {
    let markdown = ''
    
    // 处理表头（第一行）
    const headers = data[0].map(cell => this.escapeCell(cell))
    markdown += '| ' + headers.join(' | ') + ' |\n'
    
    // 添加分隔线
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n'
    
    // 处理数据行
    for (let i = 1; i < data.length; i++) {
      const row = data[i].map(cell => this.escapeCell(cell))
      markdown += '| ' + row.join(' | ') + ' |\n'
    }
    
    return markdown + '\n'
  }
  
  static createMarkdownList(data) {
    let markdown = ''
    
    data.forEach((row, index) => {
      if (row.length === 1) {
        // 单列数据作为列表项
        markdown += `- ${this.escapeCell(row[0])}\n`
      } else {
        // 多列数据作为子标题和内容
        markdown += `## 行 ${index + 1}\n\n`
        row.forEach((cell, cellIndex) => {
          if (cell !== null && cell !== undefined && cell !== '') {
            markdown += `- **列 ${cellIndex + 1}**: ${this.escapeCell(cell)}\n`
          }
        })
        markdown += '\n'
      }
    })
    
    return markdown
  }
  
  static escapeCell(cell) {
    if (cell === null || cell === undefined) {
      return ''
    }
    
    // 转换为字符串
    let cellStr = String(cell).trim()
    
    // 转义 Markdown 特殊字符
    cellStr = cellStr
      .replace(/\|/g, '\\|')  // 转义管道符
      .replace(/\n/g, ' ')    // 替换换行符为空格
      .replace(/\r/g, '')     // 移除回车符
    
    return cellStr || ' '  // 如果为空，返回空格以保持表格结构
  }
}