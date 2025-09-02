import JSZip from 'jszip'

export class PptConverter {
  static async convert(file) {
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase()
      
      if (fileExtension === 'pptx') {
        // 处理 PPTX (Office Open XML)
        return await this.convertPptx(file)
      } else if (fileExtension === 'ppt') {
        // 旧版 PPT 格式更复杂，暂时返回基础转换
        return await this.convertLegacyPpt(file)
      }
      
      throw new Error('不支持的 PowerPoint 格式')
    } catch (error) {
      return {
        success: false,
        error: `PPT/PPTX 转换失败: ${error.message}`
      }
    }
  }
  
  static async convertPptx(file) {
    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(file)
      
      // 获取演示文稿信息
      const presentationInfo = await this.getPresentationInfo(zipContent)
      
      // 获取所有幻灯片
      const slides = await this.extractSlides(zipContent)
      
      // 转换为 Markdown
      const markdown = this.convertSlidesToMarkdown(slides, file.name, presentationInfo)
      
      return {
        success: true,
        markdown,
        originalName: file.name,
        convertedAt: new Date().toISOString(),
        metadata: {
          slideCount: slides.length,
          title: presentationInfo.title || file.name.replace(/\.pptx?$/i, '')
        }
      }
    } catch (error) {
      throw error
    }
  }
  
  static async getPresentationInfo(zipContent) {
    const info = {
      title: '',
      author: '',
      subject: '',
      slideCount: 0
    }
    
    try {
      // 尝试从 app.xml 获取信息
      const appXml = await zipContent.file('docProps/app.xml')?.async('text')
      if (appXml) {
        const titleMatch = appXml.match(/<dc:title>(.*?)<\/dc:title>/i)
        if (titleMatch) info.title = this.decodeXmlEntities(titleMatch[1])
        
        const slidesMatch = appXml.match(/<Slides>(\d+)<\/Slides>/i)
        if (slidesMatch) info.slideCount = parseInt(slidesMatch[1])
      }
      
      // 尝试从 core.xml 获取信息
      const coreXml = await zipContent.file('docProps/core.xml')?.async('text')
      if (coreXml) {
        const creatorMatch = coreXml.match(/<dc:creator>(.*?)<\/dc:creator>/i)
        if (creatorMatch) info.author = this.decodeXmlEntities(creatorMatch[1])
        
        const subjectMatch = coreXml.match(/<dc:subject>(.*?)<\/dc:subject>/i)
        if (subjectMatch) info.subject = this.decodeXmlEntities(subjectMatch[1])
      }
    } catch (e) {
      console.warn('无法获取演示文稿信息:', e)
    }
    
    return info
  }
  
  static async extractSlides(zipContent) {
    const slides = []
    const slideFiles = []
    
    // 查找所有幻灯片文件
    zipContent.forEach((relativePath, file) => {
      if (relativePath.match(/^ppt\/slides\/slide\d+\.xml$/)) {
        slideFiles.push({
          path: relativePath,
          number: parseInt(relativePath.match(/slide(\d+)\.xml$/)[1])
        })
      }
    })
    
    // 按幻灯片编号排序
    slideFiles.sort((a, b) => a.number - b.number)
    
    // 提取每个幻灯片的内容
    for (const slideFile of slideFiles) {
      const slideXml = await zipContent.file(slideFile.path).async('text')
      const slideContent = this.parseSlideContent(slideXml, slideFile.number)
      
      // 尝试获取幻灯片注释
      const notesPath = slideFile.path.replace('slides/slide', 'notesSlides/notesSlide')
      const notesXml = await zipContent.file(notesPath)?.async('text')
      if (notesXml) {
        slideContent.notes = this.parseNotesContent(notesXml)
      }
      
      slides.push(slideContent)
    }
    
    return slides
  }
  
  static parseSlideContent(xml, slideNumber) {
    const slide = {
      number: slideNumber,
      title: '',
      content: [],
      lists: [],
      tables: [],
      notes: ''
    }
    
    // 提取标题
    const titleMatches = xml.match(/<p:title[^>]*>[\s\S]*?<a:t[^>]*>([\s\S]*?)<\/a:t>[\s\S]*?<\/p:title>/gi)
    if (titleMatches) {
      titleMatches.forEach(match => {
        const textMatch = match.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/i)
        if (textMatch) {
          slide.title = this.decodeXmlEntities(textMatch[1])
        }
      })
    }
    
    // 提取所有文本内容
    const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || []
    textMatches.forEach(match => {
      const text = match.replace(/<[^>]+>/g, '')
      if (text.trim() && text !== slide.title) {
        slide.content.push(this.decodeXmlEntities(text.trim()))
      }
    })
    
    // 提取列表项
    const listItems = xml.match(/<a:buChar[^>]*>[\s\S]*?<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || []
    listItems.forEach(match => {
      const textMatch = match.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/i)
      if (textMatch) {
        slide.lists.push(this.decodeXmlEntities(textMatch[1]))
      }
    })
    
    // 提取表格（简化处理）
    if (xml.includes('<a:tbl>')) {
      slide.tables.push('[表格内容]')
    }
    
    return slide
  }
  
  static parseNotesContent(xml) {
    const notes = []
    const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || []
    
    textMatches.forEach(match => {
      const text = match.replace(/<[^>]+>/g, '').trim()
      if (text) {
        notes.push(this.decodeXmlEntities(text))
      }
    })
    
    return notes.join('\n')
  }
  
  static convertSlidesToMarkdown(slides, filename, info) {
    let markdown = ''
    
    // 添加文档标题
    const title = info.title || filename.replace(/\.pptx?$/i, '')
    markdown += `# ${title}\n\n`
    
    // 添加元信息
    if (info.author) {
      markdown += `**作者**: ${info.author}\n\n`
    }
    if (info.subject) {
      markdown += `**主题**: ${info.subject}\n\n`
    }
    
    markdown += '---\n\n'
    
    // 转换每个幻灯片
    slides.forEach((slide, index) => {
      // 幻灯片编号和标题
      if (slide.title) {
        markdown += `## 幻灯片 ${slide.number}: ${slide.title}\n\n`
      } else {
        markdown += `## 幻灯片 ${slide.number}\n\n`
      }
      
      // 幻灯片内容
      if (slide.content.length > 0) {
        // 去重并过滤已包含在标题中的内容
        const uniqueContent = [...new Set(slide.content)]
          .filter(text => text !== slide.title)
        
        uniqueContent.forEach(text => {
          // 检查是否是列表项
          if (slide.lists.includes(text)) {
            markdown += `- ${text}\n`
          } else {
            markdown += `${text}\n\n`
          }
        })
      }
      
      // 列表项（如果没有在内容中处理）
      if (slide.lists.length > 0) {
        const processedLists = slide.lists.filter(item => 
          !slide.content.includes(item)
        )
        if (processedLists.length > 0) {
          markdown += '\n'
          processedLists.forEach(item => {
            markdown += `- ${item}\n`
          })
          markdown += '\n'
        }
      }
      
      // 表格
      if (slide.tables.length > 0) {
        slide.tables.forEach(table => {
          markdown += `\n${table}\n\n`
        })
      }
      
      // 演讲者备注
      if (slide.notes) {
        markdown += `\n**演讲者备注**:\n> ${slide.notes.replace(/\n/g, '\n> ')}\n\n`
      }
      
      // 幻灯片之间的分隔
      if (index < slides.length - 1) {
        markdown += '---\n\n'
      }
    })
    
    return markdown.trim()
  }
  
  static async convertLegacyPpt(file) {
    // 旧版 PPT 格式（二进制格式）更复杂
    // 这里提供一个基础实现，主要返回提示信息
    const markdown = `# ${file.name.replace(/\.ppt$/i, '')}\n\n` +
      `> ⚠️ 注意：旧版 PPT 格式（.ppt）的转换支持有限。建议将文件另存为 PPTX 格式以获得更好的转换效果。\n\n` +
      `**文件信息**:\n` +
      `- 文件名: ${file.name}\n` +
      `- 文件大小: ${(file.size / 1024).toFixed(2)} KB\n` +
      `- 最后修改: ${new Date(file.lastModified).toLocaleString()}\n\n` +
      `---\n\n` +
      `由于 PPT 文件使用专有的二进制格式，无法直接提取内容。请考虑：\n\n` +
      `1. 在 PowerPoint 中打开文件\n` +
      `2. 另存为 PPTX 格式\n` +
      `3. 重新上传 PPTX 文件进行转换\n`
    
    return {
      success: true,
      markdown,
      originalName: file.name,
      convertedAt: new Date().toISOString(),
      metadata: {
        warning: '旧版 PPT 格式支持有限'
      }
    }
  }
  
  static decodeXmlEntities(text) {
    if (!text) return ''
    
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => 
        String.fromCharCode(parseInt(hex, 16))
      )
      .replace(/&#(\d+);/g, (match, dec) => 
        String.fromCharCode(parseInt(dec, 10))
      )
  }
}