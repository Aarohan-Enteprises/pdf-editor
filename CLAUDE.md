# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PDF2.in is a browser-based PDF editing application. Most PDF processing happens client-side. Some operations (compression, PDF↔DOCX conversion) use a Python backend. Frontend deployed to GitHub Pages, backend to EC2.

## Commands

### Frontend (Next.js)
```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build (static export to ./out)
npm run lint     # ESLint with Next.js rules
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## When to Run Builds

- **Frontend changes** (`src/`, `public/`, `package.json`) → Run `npm run build`
- **Backend changes** (`backend/`) → NO npm build needed, just commit and deploy
- **Docker changes** (`docker/`, `docker-compose.yml`) → NO npm build needed

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

## Backend Architecture

### Directory Structure
- `backend/main.py` - FastAPI application with all API endpoints
- `backend/requirements.txt` - Python dependencies
- `docker/Dockerfile.backend` - Docker image for backend
- `.github/workflows/deploy-backend.yml` - EC2 deployment workflow

### API Endpoints
- `POST /api/compress` - PDF compression (Ghostscript)
- `POST /api/lock` - Password protect PDF (Ghostscript)
- `POST /api/unlock` - Remove PDF password (Ghostscript)
- `POST /api/docx-to-pdf` - DOCX to PDF (LibreOffice)
- `POST /api/pdf-to-docx` - PDF to DOCX (PyMuPDF or LibreOffice)
- `GET /api/engines` - Check available conversion engines
- `GET /health` - Health check

### Dependencies
- **Ghostscript** - PDF compression, encryption
- **LibreOffice** - DOCX↔PDF conversion fallback
- **PyMuPDF + python-docx** - PDF to DOCX (primary, lightweight)

### Important: Avoid Heavy ML Libraries
**DO NOT use Docling, PyTorch, or Transformers** for this project. We tried Docling for PDF-to-DOCX conversion and it:
- Adds ~2-3GB to Docker image (vs ~50MB for PyMuPDF)
- Requires 4-8GB RAM minimum
- Takes 30+ minutes to build
- Crashed EC2 t3.medium due to disk/memory limits

Use lightweight alternatives like PyMuPDF, pdf2docx, or LibreOffice instead.

## Deployment

- **Frontend**: Auto-deploys to GitHub Pages on push to master
- **Backend**: Auto-deploys to EC2 via `.github/workflows/deploy-backend.yml`
- Backend runs on t3.medium (4GB RAM) - keep dependencies lightweight
