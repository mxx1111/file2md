import * as pdfjsLib from 'pdfjs-dist'

// 动态设置worker路径，适应开发和生产环境
const isProduction = import.meta.env.PROD
const baseUrl = isProduction ? import.meta.env.BASE_URL || './' : '/'
pdfjsLib.GlobalWorkerOptions.workerSrc = `${baseUrl}pdf.worker.min.js`

export class PdfConverter {
  static async convert(file) {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file)
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      const totalPages = pdf.numPages
      
      // 逐页提取文本
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = this.extractTextFromPage(textContent)
        
        if (pageText.trim()) {
          fullText += `\n## 第 ${pageNum} 页\n\n${pageText}\n\n---\n`
        }
      }
      
      const markdown = this.convertToMarkdown(fullText, file.name, totalPages)
      
      return {
        success: true,
        markdown,
        originalName: file.name,
        totalPages,
        convertedAt: new Date().toISOString(),
        metadata: {
          title: file.name.replace('.pdf', ''),
          pages: totalPages,
          size: file.size
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `PDF转换失败: ${error.message}`,
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
  
  static extractTextFromPage(textContent) {
    let text = ''
    let lastY = null
    let line = ''
    
    // 处理文本项，按位置组织内容
    textContent.items.forEach((item, index) => {
      const currentY = item.transform[5]
      
      // 检测换行（Y坐标变化）
      if (lastY !== null && Math.abs(currentY - lastY) > 5) {
        if (line.trim()) {
          text += line.trim() + '\n'
        }
        line = ''
      }
      
      line += item.str + ' '
      lastY = currentY
    })
    
    // 添加最后一行
    if (line.trim()) {
      text += line.trim() + '\n'
    }
    
    return this.cleanText(text)
  }
  
  static cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // 合并多余空格
      .replace(/\n\s*\n\s*\n/g, '\n\n') // 合并多余换行
      .replace(/^\s+|\s+$/g, '') // 去除首尾空白
  }
  
  static convertToMarkdown(content, filename, totalPages) {
    let markdown = `# ${filename.replace('.pdf', '')}\n\n`
    markdown += `> 📄 PDF文档转换 | 共 ${totalPages} 页 | 转换时间: ${new Date().toLocaleString()}\n\n`
    
    // 按段落分割内容
    const sections = content.split(/^## 第 \d+ 页$/gm).filter(Boolean)
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        const lines = section.split('\n').filter(line => line.trim() && line !== '---')
        
        if (lines.length > 0) {
          // 处理标题和内容
          const processedLines = this.processLines(lines)
          markdown += processedLines.join('\n') + '\n\n'
        }
      }
    })
    
    return markdown
  }
  
  static processLines(lines) {
    const processed = []
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return
      
      // 检测可能的标题
      if (this.isLikelyTitle(trimmed)) {
        processed.push(`### ${trimmed}`)
      } else if (this.isLikelyListItem(trimmed)) {
        processed.push(`- ${trimmed}`)
      } else {
        processed.push(trimmed)
      }
    })
    
    return processed
  }
  
  static isLikelyTitle(line) {
    // 标题识别逻辑
    return (
      line.length < 100 && // 不太长
      !line.endsWith('.') && // 不以句号结尾
      (
        /^[一二三四五六七八九十\d]+[、．.]/.test(line) || // 数字开头
        /^第[一二三四五六七八九十\d]+章/.test(line) || // 第X章
        line.split('').every(char => /[\u4e00-\u9fa5A-Za-z0-9\s]/.test(char)) // 只含中英数字
      )
    )
  }
  
  static isLikelyListItem(line) {
    return /^[·•*-]\s/.test(line) || /^\d+[.)]\s/.test(line)
  }
}