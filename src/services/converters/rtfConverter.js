// RTF 转换器 - 浏览器端实现
export class RtfConverter {
  static async convert(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const rtfContent = e.target.result
          const markdown = this.convertToMarkdown(rtfContent, file.name)
          
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
  
  static convertToMarkdown(rtfContent, filename) {
    let markdown = `# ${filename.replace(/\.rtf$/i, '')}\n\n`
    
    // 基本的RTF解析
    let text = rtfContent
    
    // 移除RTF头部和尾部
    text = text.replace(/^[\s\S]*?\\viewkind\d+\s*/i, '')
    text = text.replace(/\}[\s\S]*$/g, '')
    
    // 处理段落
    text = text.replace(/\\par\s*/g, '\n\n')
    
    // 处理换行
    text = text.replace(/\\line\s*/g, '\n')
    
    // 处理粗体
    text = text.replace(/\\b\s+(.*?)\\b0/g, '**$1**')
    
    // 处理斜体
    text = text.replace(/\\i\s+(.*?)\\i0/g, '*$1*')
    
    // 处理下划线（转为粗体，因为Markdown不支持下划线）
    text = text.replace(/\\ul\s+(.*?)\\ulnone/g, '**$1**')
    
    // 处理标题（基于字体大小）
    text = text.replace(/\\fs(\d+)\s+(.*?)(?=\\fs\d+|\\par|$)/g, (match, size, content) => {
      const fontSize = parseInt(size)
      if (fontSize >= 48) {
        return `# ${content.trim()}\n\n`
      } else if (fontSize >= 36) {
        return `## ${content.trim()}\n\n`
      } else if (fontSize >= 28) {
        return `### ${content.trim()}\n\n`
      }
      return content
    })
    
    // 处理列表项
    text = text.replace(/\\bullet\s*/g, '- ')
    
    // 处理制表符
    text = text.replace(/\\tab\s*/g, '\t')
    
    // 处理特殊字符
    text = text.replace(/\\'([0-9a-f]{2})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
    
    // 处理Unicode字符
    text = text.replace(/\\u(\d+)\?/g, (match, code) => {
      return String.fromCharCode(parseInt(code))
    })
    
    // 移除其他RTF控制字符
    text = text.replace(/\\[a-z]+\d*\s?/gi, '')
    text = text.replace(/[\{\}]/g, '')
    
    // 清理多余的空行
    text = text.replace(/\n{3,}/g, '\n\n')
    text = text.trim()
    
    if (text) {
      markdown += text
    } else {
      markdown += '*无法提取RTF内容，文件可能已损坏或格式不支持*'
    }
    
    return markdown
  }
}