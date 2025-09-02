import TurndownService from 'turndown'

export class HtmlConverter {
  static async convert(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const htmlContent = e.target.result
          const markdown = this.convertToMarkdown(htmlContent, file.name)
          
          resolve({
            success: true,
            markdown,
            originalName: file.name,
            convertedAt: new Date().toISOString(),
            metadata: {
              originalLength: htmlContent.length,
              markdownLength: markdown.length
            }
          })
        } catch (error) {
          reject({
            success: false,
            error: `HTML 转换失败: ${error.message}`
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
  
  static convertToMarkdown(htmlContent, filename) {
    // 创建 TurndownService 实例并配置
    const turndownService = new TurndownService({
      headingStyle: 'atx',  // 使用 # 作为标题
      codeBlockStyle: 'fenced',  // 使用 ``` 作为代码块
      bulletListMarker: '-',  // 使用 - 作为无序列表标记
      strongDelimiter: '**',  // 使用 ** 作为加粗
      emDelimiter: '*',  // 使用 * 作为斜体
      linkStyle: 'inlined',  // 内联链接样式
      linkReferenceStyle: 'full'
    })
    
    // 添加自定义规则
    this.addCustomRules(turndownService)
    
    // 提取页面标题
    let pageTitle = filename.replace(/\.html?$/i, '')
    const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      pageTitle = this.decodeHtml(titleMatch[1].trim())
    }
    
    // 提取 body 内容，如果没有 body 标签则使用全部内容
    let bodyContent = htmlContent
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch && bodyMatch[1]) {
      bodyContent = bodyMatch[1]
    }
    
    // 清理 HTML
    bodyContent = this.cleanHtml(bodyContent)
    
    // 转换为 Markdown
    let markdown = turndownService.turndown(bodyContent)
    
    // 后处理
    markdown = this.postProcessMarkdown(markdown)
    
    // 添加标题
    if (pageTitle && !markdown.startsWith('# ')) {
      markdown = `# ${pageTitle}\n\n${markdown}`
    }
    
    return markdown
  }
  
  static addCustomRules(turndownService) {
    // 保留表格
    turndownService.addRule('tables', {
      filter: ['table'],
      replacement: function(content, node) {
        // 如果表格内容为空，跳过
        if (!content.trim()) return ''
        
        // 尝试转换表格为 Markdown 格式
        const rows = Array.from(node.querySelectorAll('tr'))
        if (rows.length === 0) return content
        
        let markdown = '\n\n'
        let hasHeader = false
        
        rows.forEach((row, index) => {
          const cells = Array.from(row.querySelectorAll('td, th'))
          if (cells.length === 0) return
          
          const isHeader = cells[0].tagName === 'TH'
          const cellContents = cells.map(cell => {
            const text = cell.textContent.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ')
            return text || ' '
          })
          
          markdown += '| ' + cellContents.join(' | ') + ' |\n'
          
          if (index === 0 || (isHeader && !hasHeader)) {
            markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n'
            hasHeader = true
          }
        })
        
        return markdown + '\n'
      }
    })
    
    // 处理代码块
    turndownService.addRule('preCode', {
      filter: function(node) {
        return node.nodeName === 'PRE' && node.querySelector('code')
      },
      replacement: function(content, node) {
        const codeElement = node.querySelector('code')
        const language = codeElement.className.match(/language-(\w+)/)?.[1] || ''
        const code = codeElement.textContent
        return '\n```' + language + '\n' + code + '\n```\n'
      }
    })
    
    // 移除脚本和样式
    turndownService.addRule('removeScripts', {
      filter: ['script', 'style', 'noscript'],
      replacement: () => ''
    })
    
    // 处理图片
    turndownService.addRule('images', {
      filter: 'img',
      replacement: function(content, node) {
        const alt = node.alt || 'image'
        const src = node.src || ''
        const title = node.title ? ` "${node.title}"` : ''
        
        if (!src) return ''
        
        // 如果是 base64 图片，保留前100个字符作为预览
        if (src.startsWith('data:')) {
          const preview = src.substring(0, 100) + '...'
          return `![${alt}](${preview}${title})`
        }
        
        return `![${alt}](${src}${title})`
      }
    })
    
    // 处理视频和音频
    turndownService.addRule('media', {
      filter: ['video', 'audio'],
      replacement: function(content, node) {
        const src = node.src || node.querySelector('source')?.src || ''
        const type = node.nodeName.toLowerCase()
        return src ? `[${type}: ${src}](${src})` : ''
      }
    })
    
    // 处理 iframe
    turndownService.addRule('iframe', {
      filter: 'iframe',
      replacement: function(content, node) {
        const src = node.src || ''
        const title = node.title || 'Embedded content'
        return src ? `[${title}](${src})` : ''
      }
    })
  }
  
  static cleanHtml(html) {
    // 移除注释
    html = html.replace(/<!--[\s\S]*?-->/g, '')
    
    // 移除多余的空白
    html = html.replace(/\s+/g, ' ')
    
    // 移除空的段落和 div
    html = html.replace(/<(p|div)[^>]*>\s*<\/(p|div)>/gi, '')
    
    // 规范化换行
    html = html.replace(/<br\s*\/?>/gi, '\n')
    
    return html
  }
  
  static postProcessMarkdown(markdown) {
    // 移除多余的空行
    markdown = markdown.replace(/\n{3,}/g, '\n\n')
    
    // 修复列表格式
    markdown = markdown.replace(/^(\s*)-\s+/gm, '- ')
    markdown = markdown.replace(/^(\s*)\d+\.\s+/gm, '$11. ')
    
    // 清理行尾空格
    markdown = markdown.replace(/ +$/gm, '')
    
    // 确保代码块前后有空行
    markdown = markdown.replace(/([^\n])\n```/g, '$1\n\n```')
    markdown = markdown.replace(/```\n([^\n])/g, '```\n\n$1')
    
    // 确保标题前后有空行
    markdown = markdown.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    markdown = markdown.replace(/(#{1,6} [^\n]+)\n([^\n])/g, '$1\n\n$2')
    
    return markdown.trim()
  }
  
  static decodeHtml(html) {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = html
    return textarea.value
  }
}