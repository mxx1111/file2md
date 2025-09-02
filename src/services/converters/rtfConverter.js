import rtfParser from 'rtf-parser'

export class RtfConverter {
  static async convert(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const rtfContent = e.target.result
          const markdown = await this.convertToMarkdown(rtfContent, file.name)
          
          resolve({
            success: true,
            markdown,
            originalName: file.name,
            convertedAt: new Date().toISOString(),
            metadata: {
              originalLength: rtfContent.length,
              markdownLength: markdown.length
            }
          })
        } catch (error) {
          reject({
            success: false,
            error: `RTF 转换失败: ${error.message}`
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
  
  static async convertToMarkdown(rtfContent, filename) {
    return new Promise((resolve, reject) => {
      // 解析 RTF 文档
      rtfParser.parse(rtfContent, (err, doc) => {
        if (err) {
          reject(err)
          return
        }
        
        let markdown = `# ${filename.replace(/\.rtf$/i, '')}\n\n`
        
        // 递归处理文档内容
        markdown += this.processRtfNode(doc)
        
        // 后处理
        markdown = this.postProcessMarkdown(markdown)
        
        resolve(markdown)
      })
    })
  }
  
  static processRtfNode(node, level = 0) {
    let result = ''
    
    if (!node) return result
    
    // 处理节点内容
    if (node.content) {
      if (Array.isArray(node.content)) {
        node.content.forEach(item => {
          result += this.processRtfNode(item, level)
        })
      } else if (typeof node.content === 'string') {
        result += node.content
      } else if (typeof node.content === 'object') {
        result += this.processRtfNode(node.content, level)
      }
    }
    
    // 处理段落
    if (node.type === 'paragraph') {
      const content = this.processRtfNode(node.content, level)
      
      // 检查是否是标题样式
      if (node.style && this.isHeadingStyle(node.style)) {
        const headingLevel = this.getHeadingLevel(node.style)
        result = `${'#'.repeat(headingLevel)} ${content.trim()}\n\n`
      } else if (content.trim()) {
        result = `${content.trim()}\n\n`
      }
    }
    
    // 处理列表
    else if (node.type === 'list') {
      if (node.items && Array.isArray(node.items)) {
        node.items.forEach(item => {
          const content = this.processRtfNode(item, level + 1)
          const indent = '  '.repeat(level)
          result += `${indent}- ${content.trim()}\n`
        })
      }
      result += '\n'
    }
    
    // 处理表格
    else if (node.type === 'table') {
      result += this.processTable(node)
    }
    
    // 处理文本样式
    else if (node.type === 'text') {
      let text = node.value || ''
      
      // 应用文本样式
      if (node.style) {
        if (node.style.bold) {
          text = `**${text}**`
        }
        if (node.style.italic) {
          text = `*${text}*`
        }
        if (node.style.underline) {
          // Markdown 不直接支持下划线，使用 HTML
          text = `<u>${text}</u>`
        }
        if (node.style.strikethrough) {
          text = `~~${text}~~`
        }
      }
      
      result = text
    }
    
    // 处理图片
    else if (node.type === 'picture' || node.type === 'image') {
      const alt = node.alt || 'image'
      const src = node.src || node.data || ''
      
      if (src) {
        // 如果是二进制数据，转换为 base64
        if (node.binary) {
          const base64 = this.binaryToBase64(node.binary)
          result = `![${alt}](data:image/png;base64,${base64})\n\n`
        } else {
          result = `![${alt}](${src})\n\n`
        }
      }
    }
    
    // 处理超链接
    else if (node.type === 'hyperlink') {
      const text = this.processRtfNode(node.content, level)
      const url = node.url || '#'
      result = `[${text}](${url})`
    }
    
    // 处理换行
    else if (node.type === 'line-break' || node.type === 'br') {
      result = '\n'
    }
    
    // 处理分页符
    else if (node.type === 'page-break') {
      result = '\n---\n\n'
    }
    
    // 处理其他子节点
    else if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => {
        result += this.processRtfNode(child, level)
      })
    }
    
    return result
  }
  
  static processTable(tableNode) {
    if (!tableNode.rows || !Array.isArray(tableNode.rows)) {
      return ''
    }
    
    let markdown = '\n'
    let maxColumns = 0
    
    // 获取最大列数
    tableNode.rows.forEach(row => {
      if (row.cells && row.cells.length > maxColumns) {
        maxColumns = row.cells.length
      }
    })
    
    if (maxColumns === 0) return ''
    
    // 处理表格行
    tableNode.rows.forEach((row, rowIndex) => {
      const cells = row.cells || []
      const cellContents = []
      
      for (let i = 0; i < maxColumns; i++) {
        if (i < cells.length) {
          const cellContent = this.processRtfNode(cells[i], 0)
          cellContents.push(cellContent.trim().replace(/\|/g, '\\|').replace(/\n/g, ' '))
        } else {
          cellContents.push(' ')
        }
      }
      
      markdown += '| ' + cellContents.join(' | ') + ' |\n'
      
      // 添加表头分隔线
      if (rowIndex === 0) {
        markdown += '| ' + Array(maxColumns).fill('---').join(' | ') + ' |\n'
      }
    })
    
    return markdown + '\n'
  }
  
  static isHeadingStyle(style) {
    if (!style) return false
    
    const headingPatterns = [
      /heading/i,
      /title/i,
      /header/i,
      /h[1-6]/i
    ]
    
    const styleName = style.name || style.styleName || ''
    return headingPatterns.some(pattern => pattern.test(styleName))
  }
  
  static getHeadingLevel(style) {
    const styleName = (style.name || style.styleName || '').toLowerCase()
    
    // 检查是否有明确的级别
    const levelMatch = styleName.match(/(\d)/)
    if (levelMatch) {
      const level = parseInt(levelMatch[1])
      return Math.min(Math.max(level, 1), 6)
    }
    
    // 根据样式名称判断
    if (styleName.includes('title')) return 1
    if (styleName.includes('subtitle')) return 2
    if (styleName.includes('heading')) return 2
    
    return 2  // 默认二级标题
  }
  
  static binaryToBase64(binary) {
    // 将二进制数据转换为 base64
    if (typeof binary === 'string') {
      return btoa(binary)
    } else if (binary instanceof Uint8Array) {
      let binaryString = ''
      binary.forEach(byte => {
        binaryString += String.fromCharCode(byte)
      })
      return btoa(binaryString)
    }
    return ''
  }
  
  static postProcessMarkdown(markdown) {
    // 移除多余的空行
    markdown = markdown.replace(/\n{3,}/g, '\n\n')
    
    // 修复列表格式
    markdown = markdown.replace(/^(\s*)-\s+/gm, (match, indent) => `${indent}- `)
    
    // 清理行尾空格
    markdown = markdown.replace(/ +$/gm, '')
    
    // 确保标题前后有空行
    markdown = markdown.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    markdown = markdown.replace(/(#{1,6} [^\n]+)\n([^\n#])/g, '$1\n\n$2')
    
    // 合并连续的分隔线
    markdown = markdown.replace(/(\n---\n){2,}/g, '\n---\n')
    
    return markdown.trim()
  }
}