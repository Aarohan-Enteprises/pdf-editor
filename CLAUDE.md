# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PDF2.in is a browser-based PDF editing application. All PDF processing happens client-side (no server uploads). Deployed as a static export to GitHub Pages.

## Commands

```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build (static export to ./out)
npm run lint     # ESLint with Next.js rules
```

## Tech Stack

- **Next.js 14** with App Router, configured for static export (`output: 'export'`)
- **TypeScript** with strict mode
- **Tailwind CSS** for styling
- **pdf-lib** for PDF manipulation (merge, split, rotate, watermark, etc.)
- **pdfjs-dist** for PDF rendering (thumbnails, preview)
- **@dnd-kit** for drag-and-drop page reordering
- **next-intl** for internationalization (English only currently)

## Architecture

### Directory Structure
- `src/app/` - Next.js App Router pages (each tool is a route: `/merge`, `/split`, etc.)
- `src/components/pdf/` - PDF-specific components (PDFDropzone, PDFViewer, PageThumbnail)
- `src/components/ui/` - Reusable UI components (Button, Modal)
- `src/hooks/` - Custom hooks for PDF state and rendering
- `src/lib/` - PDF utility functions
- `src/messages/` - Translation files (en.json)

### Key Patterns

**State Management:** React hooks only, no external state library.
- `usePDFDocument` - Manages loaded files and pages (enforces 200-page limit, 50MB per file)
- `usePDFPreview` - Controls preview modal state
- `usePDFRenderer` - Renders PDF pages to canvas

**PDF Processing Flow:**
1. Files uploaded via `PDFDropzone` → validated and loaded with pdf-lib
2. Pages displayed in `PDFViewer` with drag-and-drop reordering
3. Operations performed using functions in `src/lib/pdf-operations.ts`
4. Result shown in `PDFPreviewModal` before download

**Adding a New Tool:**
1. Create route at `src/app/[tool-name]/page.tsx`
2. Use `usePDFDocument` and `usePDFPreview` hooks
3. Add operation function in `src/lib/pdf-operations.ts`
4. Add translations in `src/messages/en.json`
5. Add tool card in `src/app/page.tsx`

### Path Alias
Use `@/` for imports (maps to `./src/`).
