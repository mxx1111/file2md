# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a pure frontend file-to-Markdown converter application built with Vue 3 + Vite. It converts various office document formats (TXT, PDF, DOC/DOCX, XLS/XLSX) to Markdown format entirely in the browser, ensuring data privacy and security.

## Common Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Vue 3.5** with Composition API
- **Element Plus** for UI components
- **Vite 7** for build tooling
- **Pinia** for state management (if needed)

### Core Dependencies and Usage
- **mammoth** (`^1.10.0`): Word document (.doc/.docx) parsing and conversion
- **xlsx** (`^0.18.5`): Excel file (.xls/.xlsx) processing
- **pdfjs-dist** (`^5.4.149`): PDF document text extraction
- **marked** (`^16.2.1`): Markdown parsing and rendering
- **file-saver** (`^2.0.5`): File download functionality
- **jszip** (`^3.10.1`): ZIP file creation for batch downloads

### Project Structure

```
src/
├── components/           # Reusable Vue components
│   ├── FileUpload.vue    # Drag-and-drop file upload with validation
│   └── MarkdownPreview.vue # Multi-mode (preview/source/split) Markdown viewer
├── services/
│   └── converters/       # File converter implementations
│       ├── index.js      # ConverterFactory - main entry point for conversions
│       ├── txtConverter.js    # TXT to Markdown (smart paragraph/title detection)
│       ├── pdfConverter.js    # PDF to Markdown (uses pdfjs-dist)
│       ├── docConverter.js    # Word to Markdown (uses mammoth)
│       └── excelConverter.js  # Excel to Markdown tables (uses xlsx)
├── utils/
│   └── fileUtils.js      # File type detection, validation, reading utilities
├── views/
│   └── MainView.vue      # Main application view with conversion workflow
├── App.vue               # Root component
└── main.js              # Application entry point
```

## Converter Pattern

All converters follow the same pattern and must implement:

```javascript
export class XxxConverter {
  static async convert(file) {
    // Returns: { success: boolean, markdown: string, originalName: string, ... }
  }
}
```

The `ConverterFactory` in `src/services/converters/index.js` manages converter selection based on file type.

## File Type Support

Current implementation status:
- **TXT**: Full support with intelligent paragraph/title detection
- **PDF**: Text extraction using pdfjs-dist (page-by-page processing)
- **DOC/DOCX**: Full conversion including tables, images (base64), styles using mammoth
- **XLS/XLSX**: Multi-sheet support, converts to Markdown tables

## Key Implementation Details

### PDF.js Worker Configuration
PDF.js requires a worker for processing. The worker is loaded from CDN in `pdfConverter.js`:
```javascript
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
```

### File Size Limit
Default limit is 10MB per file, validated in `fileUtils.js` and `FileUpload.vue`

### Conversion Flow
1. User uploads files via `FileUpload.vue`
2. `MainView.vue` manages conversion state and progress
3. `ConverterFactory` selects appropriate converter based on file type
4. Converter processes file and returns Markdown
5. `MarkdownPreview.vue` displays result with export options

## Testing Locally

To test the application:
1. Run `npm run dev`
2. Upload test files of different formats
3. Check console for any conversion errors
4. Verify Markdown output quality
5. Test export functionality (MD/HTML download)

## Common Issues and Solutions

### Large File Performance
- Files over 5MB may cause slower processing
- Consider implementing chunked processing for very large files
- Monitor browser memory usage during conversions

### PDF Text Extraction
- Scanned PDFs (image-only) won't extract text
- Complex PDF layouts may lose formatting
- Tables in PDFs are converted to plain text

### Word Document Images
- Images are converted to base64 data URLs
- Large images significantly increase Markdown file size
- Consider adding image size optimization

### Excel Complex Formats
- Merged cells show content in first cell only
- Formulas show calculated values, not formulas
- Charts and graphs are not converted

## Future Enhancements to Consider
- Add PPT/PPTX support
- Implement RTF converter
- Add progress indicators for large file processing
- Support for batch file uploads with ZIP export
- Add configuration options for conversion parameters