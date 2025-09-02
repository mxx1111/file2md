import mammoth from 'mammoth'

export class DocConverter {
  static async convert(file) {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file)
      
      // 配置mammoth转换选项
      const options = {
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read("base64").then(function(imageBuffer) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            }
          })
        }),
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh"
        ]
      }
      
      const result = await mammoth.convertToHtml({ arrayBuffer }, options)
      const markdown = this.htmlToMarkdown(result.value, file.name)
      
      return {
        success: true,
        markdown,
        originalName: file.name,
        convertedAt: new Date().toISOString(),
        warnings: result.messages.filter(m => m.type === 'warning'),
        metadata: {
          title: file.name.replace(/\.(doc|docx)$/i, ''),
          size: file.size,
          hasImages: result.value.includes('<img'),
          hasTables: result.value.includes('<table')
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Word文档转换失败: ${error.message}`,
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
  
  static htmlToMarkdown(html, filename) {
    let markdown = `# ${filename.replace(/\.(doc|docx)$/i, '')}\n\n`
    markdown += `> 📝 Word文档转换 | 转换时间: ${new Date().toLocaleString()}\n\n`
    
    // 创建临时DOM来解析HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // 处理各种HTML元素
    markdown += this.processElement(doc.body)
    
    return this.cleanupMarkdown(markdown)
  }
  
  static processElement(element) {
    let result = ''
    
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent.trim()
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        result += this.convertHtmlElement(node)
      }
    }
    
    return result
  }
  
  static convertHtmlElement(element) {
    const tagName = element.tagName.toLowerCase()
    const textContent = element.textContent.trim()
    
    switch (tagName) {
      case 'h1':
        return `\n# ${textContent}\n\n`
      case 'h2':
        return `\n## ${textContent}\n\n`
      case 'h3':
        return `\n### ${textContent}\n\n`
      case 'h4':
        return `\n#### ${textContent}\n\n`
      case 'h5':
        return `\n##### ${textContent}\n\n`
      case 'h6':
        return `\n###### ${textContent}\n\n`
      
      case 'p':
        if (!textContent) return '\n'
        return `${textContent}\n\n`
      
      case 'strong':
      case 'b':
        return `**${textContent}**`
      
      case 'em':
      case 'i':
        return `*${textContent}*`
      
      case 'u':
        return `<u>${textContent}</u>`
      
      case 'ul':
        return this.processList(element, '-')
      
      case 'ol':
        return this.processList(element, '1.')
      
      case 'li':
        return textContent
      
      case 'table':
        return this.processTable(element)
      
      case 'img':
        const src = element.getAttribute('src')
        const alt = element.getAttribute('alt') || '图片'
        return `\n![${alt}](${src})\n\n`
      
      case 'a':
        const href = element.getAttribute('href')
        return href ? `[${textContent}](${href})` : textContent
      
      case 'blockquote':
        return `\n> ${textContent}\n\n`
      
      case 'code':
        return `\`${textContent}\``
      
      case 'pre':
        return `\n\`\`\`\n${textContent}\n\`\`\`\n\n`
      
      case 'br':
        return '\n'
      
      case 'hr':
        return '\n---\n\n'
      
      default:
        // 处理嵌套元素
        return this.processElement(element)
    }
  }
  
  static processList(listElement, marker) {
    let result = '\n'
    const items = listElement.querySelectorAll('li')
    
    items.forEach((item, index) => {
      const itemText = item.textContent.trim()
      if (itemText) {
        const actualMarker = marker === '1.' ? `${index + 1}.` : marker
        result += `${actualMarker} ${itemText}\n`
      }
    })
    
    return result + '\n'
  }
  
  static processTable(tableElement) {
    const rows = tableElement.querySelectorAll('tr')
    if (rows.length === 0) return ''
    
    let markdown = '\n'
    
    // 处理表头
    const headerRow = rows[0]
    const headerCells = headerRow.querySelectorAll('th, td')
    if (headerCells.length > 0) {
      markdown += '| ' + Array.from(headerCells).map(cell => 
        cell.textContent.trim() || ' '
      ).join(' | ') + ' |\n'
      
      // 添加分隔行
      markdown += '| ' + Array.from(headerCells).map(() => '---').join(' | ') + ' |\n'
      
      // 处理数据行
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const cells = row.querySelectorAll('td, th')
        if (cells.length > 0) {
          markdown += '| ' + Array.from(cells).map(cell => 
            cell.textContent.trim() || ' '
          ).join(' | ') + ' |\n'
        }
      }
    }
    
    return markdown + '\n'
  }
  
  static cleanupMarkdown(markdown) {
    return markdown
      .replace(/\n{3,}/g, '\n\n') // 合并多余换行
      .replace(/^\s+|\s+$/g, '') // 去除首尾空白
      .replace(/\*\*\s*\*\*/g, '') // 去除空的加粗标记
      .replace(/\*\s*\*/g, '') // 去除空的斜体标记
      .replace(/\n\s*\n\s*\n/g, '\n\n') // 合并空行
  }
}