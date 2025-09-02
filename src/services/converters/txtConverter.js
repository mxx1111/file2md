export class TxtConverter {
  static async convert(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target.result
          const markdown = this.convertToMarkdown(content, file.name)
          resolve({
            success: true,
            markdown,
            originalName: file.name,
            convertedAt: new Date().toISOString()
          })
        } catch (error) {
          reject({
            success: false,
            error: error.message,
            file: file.name
          })
        }
      }
      
      reader.onerror = () => {
        reject({
          success: false,
          error: '文件读取失败',
          file: file.name
        })
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }
  
  static convertToMarkdown(content, filename) {
    // 基本的文本到Markdown转换逻辑
    let markdown = `# ${filename.replace('.txt', '')}\n\n`
    
    // 处理空行和段落
    const paragraphs = content.split(/\n\s*\n/)
    
    paragraphs.forEach(paragraph => {
      const lines = paragraph.trim().split('\n')
      
      if (lines.length === 0) return
      
      // 检测是否为标题（以数字、字母或特殊符号开头）
      const firstLine = lines[0].trim()
      
      if (this.isTitle(firstLine)) {
        markdown += `## ${firstLine}\n\n`
        if (lines.length > 1) {
          markdown += lines.slice(1).join('\n') + '\n\n'
        }
      } else if (this.isList(firstLine)) {
        // 处理列表
        lines.forEach(line => {
          const trimmed = line.trim()
          if (trimmed) {
            markdown += `- ${trimmed}\n`
          }
        })
        markdown += '\n'
      } else {
        // 普通段落
        markdown += paragraph.trim() + '\n\n'
      }
    })
    
    return markdown
  }
  
  static isTitle(line) {
    // 判断是否为标题的简单规则
    const titlePatterns = [
      /^第[一二三四五六七八九十\d]+章/, // 第X章
      /^[一二三四五六七八九十\d]+[、．.]/, // 数字标题
      /^[A-Za-z\d]+[、．.]/, // 字母数字标题
      /^[一二三四五六七八九十]+、/ // 中文数字标题
    ]
    
    return titlePatterns.some(pattern => pattern.test(line)) || 
           (line.length < 50 && !line.includes('。'))
  }
  
  static isList(line) {
    // 判断是否为列表项
    const listPatterns = [
      /^[·•*-]\s/,
      /^\d+[.)]\s/,
      /^[（(]\d+[）)]\s/
    ]
    
    return listPatterns.some(pattern => pattern.test(line))
  }
}