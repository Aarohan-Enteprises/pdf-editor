# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PDF2.in is a browser-based PDF editing application. Most PDF processing happens client-side. Some operations (compression, PDF↔DOCX conversion) use a Python backend. Frontend deployed to GitHub Pages, backend to EC2.

## Commands

```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build (static export to ./out)
npm run lint     # ESLint with Next.js rules
```

Backend:
```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

## File Map

### Core Config
| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Design tokens: custom shadows (`soft`, `glass`, `button`), animations (`fade-in-up`, `scale-in`, `float`), keyframes |
| `src/app/globals.css` | Global styles, `.checkerboard` (transparency preview), `.glass-card`, `.gradient-border`, animation delays, reduced-motion |
| `src/messages/en.json` | All translation strings (tools, nav, footer, hero, dropzone) |
| `src/lib/seo.ts` | SEO metadata per tool page (title, description, keywords, path) |
| `next.config.mjs` | Next.js config — static export (`output: 'export'`) |

### Layout Components
| File | What it does |
|------|-------------|
| `src/components/layout/Header.tsx` | Minimal sticky header: logo + About link. Scroll hide/show via `useRef(lastScrollY)`. No tools dropdown. |
| `src/components/layout/Footer.tsx` | Single-line indigo gradient footer: logo, appName, tagline, privacy badge. No About link. |
| `src/components/layout/PageLayout.tsx` | Wrapper: Header + main + Footer |

### Shared Components
| File | What it does |
|------|-------------|
| `src/components/pdf/PDFDropzone.tsx` | File upload dropzone with drag-active pulse animation. Accepts PDF files. |
| `src/components/pdf/PDFViewer.tsx` | Grid of page thumbnails with drag-and-drop reorder, rotate, delete |
| `src/components/pdf/PageThumbnail.tsx` | Single page thumbnail with selection, rotation badge |
| `src/components/PDFPreviewModal.tsx` | Full-screen PDF preview before download |
| `src/components/pdf/SplitModal.tsx` | Split configuration modal |
| `src/components/pdf/WatermarkModal.tsx` | Watermark options modal |
| `src/components/pdf/UnlockModal.tsx` | Password input for locked PDFs |

### Hooks
| File | Purpose |
|------|---------|
| `src/hooks/usePDFDocument.ts` | Manages loaded files + pages state. 200-page limit, 50MB/file. Exports: `addFiles`, `removePage`, `removeFile`, `reorderPages`, `reorderFiles`, `rotatePage` |
| `src/hooks/usePDFPreview.ts` | Preview modal state. Exports: `showPreview(data, filename)`, `closePreview`, `downloadPreview` |
| `src/hooks/usePDFRenderer.ts` | Renders PDF pages to canvas via pdfjs-dist |

### Lib
| File | Purpose |
|------|---------|
| `src/lib/pdf-operations.ts` | All PDF operations: `mergePDFsWithOrder`, `splitPDF`, `rotatePDFPages`, `addWatermark`, `compressPDF`, `addPageNumbers`, `getPDFPageCount`, `checkPDFEncryption`, `imagesToPDF`, etc. |
| `src/lib/pdf-renderer.ts` | PDF-to-canvas rendering helpers |
| `src/lib/seo.ts` | SEO config map: key = tool slug, value = `{ title, description, keywords, path }` |

### Landing Page
| File | What it contains |
|------|-----------------|
| `src/app/page.tsx` | Hero section (min-h-[40vh], staggered animations), tool cards grid. Tools array with `id`, `href`, `icon`, `gradient`, `category`. Categories: `organize`, `convert`, `edit`, `secure`. `ToolCard` component with gradient-border hover effect. |

### Tool Pages (all follow same pattern)
Every tool page at `src/app/[tool-name]/page.tsx`:
- Breadcrumb: `<Link href="/#tools">All Tools</Link>` inside the `mb-8` header div
- Layout: `<PageLayout>` wrapper, left sidebar (controls), right area (viewer/canvas)
- Each has a matching `layout.tsx` for SEO metadata from `src/lib/seo.ts`

**All tool routes:**
`merge`, `split`, `rotate`, `compress`, `watermark`, `sign-pdf`, `extract-text`, `page-numbers`, `edit-metadata`, `redact`, `delete-pages`, `reverse-pages`, `duplicate-pages`, `insert-blank`, `lock-pdf`, `unlock-pdf`, `docx-to-pdf`, `pdf-to-docx`, `jpg-to-pdf`, `pdf-to-jpg`

### Notable Tool: Sign PDF (`src/app/sign-pdf/page.tsx`)
Complex tool with 3 signature modes:
- **`draw`** (default): HTML5 Canvas freehand drawing, color picker, stroke width slider, undo/clear. State: `drawPaths[]`, `drawCanvasRef`. Converts to PNG via `convertDrawingToSignature()`.
- **`text`**: Type signature with 9 Google Fonts + system cursive, color, size, bold/italic. Renders via `generateTextSignature()` on canvas.
- **`upload`**: Image upload with **auto background removal** (ON by default). Algorithm in `removeImageBackground()`: samples image corners/edges → median background color → Euclidean color distance → smooth feathering. Hardcoded sensitivity 230.
- Signature positioning: interactive drag/resize overlay on PDF page preview with corner + edge handles, touch support.
- Multi-page support: `pageSignatures` Map<pageNumber, SignaturePosition>.

### Backend
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI: `/api/compress` (Ghostscript), `/api/lock`, `/api/unlock`, `/api/docx-to-pdf` (LibreOffice), `/api/pdf-to-docx` (PyMuPDF), `/health` |
| `backend/requirements.txt` | Python deps |
| `docker/Dockerfile.backend` | Backend Docker image |
| `.github/workflows/deploy-backend.yml` | EC2 auto-deploy |

## Adding a New Tool

1. Create `src/app/[tool-name]/page.tsx` — copy pattern from `merge/page.tsx`
2. Create `src/app/[tool-name]/layout.tsx` — copy from any existing, update SEO key
3. Add breadcrumb inside `<div className="mb-8">`: `<Link href="/#tools">All Tools</Link>`
4. Add operation function in `src/lib/pdf-operations.ts` if needed
5. Add translations under `tools.[toolName]` in `src/messages/en.json`
6. Add SEO entry in `src/lib/seo.ts`
7. Add tool card to the `tools` array in `src/app/page.tsx` with correct `category`

## Rules

- **No heavy libraries**: Backend: no Docling/PyTorch/Transformers. Frontend: no `@imgly/background-removal` (~40MB), no `@huggingface/transformers`. Use canvas pixel manipulation for image processing.
- **Keep dependencies lightweight**: Backend runs on t3.medium (4GB RAM).
- **Path alias**: Use `@/` for imports (maps to `./src/`).
- **State management**: React hooks only, no Redux or external state library.

## Known Gotchas

- **Compression stats 0% bug**: Backend headers `X-Original-Size`/`X-Compressed-Size` may be missing. Always apply fallback (`file.size`/`data.length`) BEFORE calculating reduction percentage in `src/app/compress/page.tsx`.
- **Background removal**: Simple luminance thresholding fails on real photos. Must auto-detect background color by sampling corners/edges and use Euclidean color distance. See `removeImageBackground` in `sign-pdf/page.tsx`.
- **PDF encryption check**: Always call `checkPDFEncryption()` before loading a PDF. Encrypted PDFs need unlock first.

## Deployment

- **Frontend**: Auto-deploys to GitHub Pages on push to master
- **Backend**: Auto-deploys to EC2 via `.github/workflows/deploy-backend.yml`
