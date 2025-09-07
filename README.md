# File2Markdown 文件转换器

一个基于 Vue 3 的纯前端文件转 Markdown 转换器，支持多种常见文档格式的在线转换。

## 🚀 功能特性

### 支持的文件格式

| 格式 | 支持状态 | 说明 |
|------|----------|------|
| **TXT** | ✅ 完全支持 | 智能段落识别，自动格式化 |
| **PDF** | ✅ 完全支持 | 文本提取，保留页面结构 |
| **DOC/DOCX** | ✅ 完全支持 | 样式转换，表格处理，图片支持 |
| **XLS/XLSX** | ✅ 完全支持 | 多工作表支持，转换为表格 |
| **CSV/TSV** | ✅ 完全支持 | 表格数据转换 |
| **HTML/HTM** | ✅ 完全支持 | 网页内容转换 |
| **RTF** | ✅ 完全支持 | 富文本格式转换 |
| **PPT/PPTX** | ✅ 基础支持 | 文本内容提取 |

### 核心功能

- 🎯 **拖拽上传** - 支持拖拽文件或点击选择
- ⚡ **实时转换** - 浏览器端处理，保证数据安全
- 👀 **多模式预览** - 源码/预览/对比三种查看模式
- 📱 **响应式设计** - 适配桌面和移动设备
- 💾 **文件导出** - 支持 Markdown 和 HTML 格式下载
- 🔄 **批量处理** - 同时转换多个文件

## 🛠 技术栈

- **Vue 3.5** - 使用 Composition API
- **Element Plus** - UI 组件库
- **Vite 7** - 构建工具
- **mammoth** - Word 文档解析
- **xlsx** - Excel 文件处理
- **pdfjs-dist** - PDF 文档解析
- **marked** - Markdown 解析和渲染
- **turndown** - HTML 转 Markdown

## 📁 项目结构

```
src/
├── components/           # Vue 组件
│   ├── FileUpload.vue    # 文件上传组件
│   └── MarkdownPreview.vue # Markdown 预览组件
├── services/
│   └── converters/       # 文件转换器
│       ├── index.js      # 转换器工厂
│       ├── txtConverter.js    # 文本文件转换
│       ├── pdfConverter.js    # PDF 文件转换
│       ├── docConverter.js    # Word 文档转换
│       ├── excelConverter.js  # Excel 表格转换
│       ├── csvConverter.js    # CSV/TSV 转换
│       ├── htmlConverter.js   # HTML 转换
│       ├── rtfConverter.js    # RTF 转换
│       └── pptConverter.js    # PPT 转换
├── utils/
│   └── fileUtils.js      # 文件工具函数
├── views/
│   └── MainView.vue      # 主视图
├── App.vue
└── main.js
```

## 🔧 快速开始

### 环境要求

- Node.js >= 16.0
- npm >= 8.0

### 安装运行

```bash
# 克隆项目
git clone https://github.com/mxx1111/file2md.git
cd file2md

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:5173
```

### 构建部署

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 💻 使用方法

1. **上传文件**
   - 拖拽文件到上传区域
   - 或点击选择文件按钮
   - 支持同时上传多个文件

2. **转换预览**
   - 选择文件后自动开始转换
   - 实时显示转换进度
   - 转换完成后显示预览

3. **查看编辑**
   - **预览模式** - 渲染后的 Markdown 效果
   - **源码模式** - 原始 Markdown 代码
   - **对比模式** - 左右分屏对比查看

4. **导出下载**
   - 点击下载按钮选择格式
   - 支持 `.md` 和 `.html` 格式
   - 可复制内容到剪贴板

## ⚙️ 配置说明

### 文件大小限制
默认单个文件大小限制为 10MB，可在 `src/utils/fileUtils.js` 中修改：

```javascript
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
```

### 支持格式配置
在 `src/services/converters/index.js` 中查看和修改支持的文件格式。

## 🔒 隐私安全

- **纯前端处理** - 所有文件转换在浏览器端完成
- **无数据上传** - 文件不会上传到任何服务器
- **本地处理** - 保证数据完全的隐私安全

## 📋 常见问题

**Q: PDF 转换后内容不完整？**
A: 目前仅支持文本型 PDF，扫描版 PDF 需要先进行 OCR 处理。

**Q: Word 文档中的图片如何处理？**
A: 图片会转换为 base64 格式嵌入到 Markdown 中。

**Q: 支持哪些浏览器？**
A: 支持 Chrome 88+、Firefox 85+、Safari 14+、Edge 88+ 等现代浏览器。

**Q: 转换速度慢怎么办？**
A: 建议使用文件大小在 10MB 以内，避免同时转换过多文件。

## 📄 开源协议

本项目采用 MIT 协议开源 - 查看 [LICENSE](LICENSE) 了解详情。

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库  
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) - Word 文档转换
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF 解析库
- [SheetJS](https://sheetjs.com/) - Excel 文件处理
- [marked](https://marked.js.org/) - Markdown 解析器

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给个 Star！**

</div>