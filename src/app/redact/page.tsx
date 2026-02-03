'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { getPDFPageCount, checkPDFEncryption, EncryptedPDFError, applyRedactions, RedactionStyle } from '@/lib/pdf-operations';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface RedactionRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeDirection = 'se' | 'e' | 's' | 'n' | 'w' | 'ne' | 'nw' | 'sw' | null;

// Redaction style options
const redactionStyles: { value: RedactionStyle; label: string; preview: string }[] = [
  { value: 'solid', label: 'Solid Black', preview: '' },
  { value: 'redacted', label: 'REDACTED', preview: 'REDACTED' },
  { value: 'confidential', label: 'CONFIDENTIAL', preview: 'CONFIDENTIAL' },
  { value: 'sensitive', label: 'SENSITIVE', preview: 'SENSITIVE' },
  { value: 'hidden', label: '[HIDDEN]', preview: '[HIDDEN]' },
  { value: 'classified', label: 'CLASSIFIED', preview: 'CLASSIFIED' },
];

export default function RedactPdfPage() {
  const t = useTranslations('tools.redact');

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagePreview, setPagePreview] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  // Per-page redaction tracking: Map<pageNumber, RedactionRect[]>
  const [pageRedactions, setPageRedactions] = useState<Map<number, RedactionRect[]>>(new Map());

  // Currently selected redaction
  const [selectedRedaction, setSelectedRedaction] = useState<string | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawRect, setCurrentDrawRect] = useState<RedactionRect | null>(null);

  // Dragging state for moving redactions
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resize state
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });

  // Scale factor for display vs actual PDF coordinates
  const [scaleFactor, setScaleFactor] = useState(1);

  // PDF page dimensions
  const [pageHeight, setPageHeight] = useState(0);

  // Redaction style
  const [redactionStyle, setRedactionStyle] = useState<RedactionStyle>('solid');

  // Get redactions for current page
  const currentRedactions = pageRedactions.get(currentPage) || [];

  // Get display text for current style
  const getStyleText = (style: RedactionStyle): string => {
    const found = redactionStyles.find(s => s.value === style);
    return found?.preview || '';
  };

  const renderPagePreview = useCallback(async (file: File, pageNum: number) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNum);

      const viewport = page.getViewport({ scale: 1 });

      // Store actual PDF page height for coordinate conversion
      setPageHeight(viewport.height);

      // Calculate scale to fit in container - responsive max width
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const maxWidth = isMobile ? Math.min(window.innerWidth - 48, 400) : 600;
      const scale = Math.min(maxWidth / viewport.width, 1.5);
      setScaleFactor(scale);

      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      const ctx = canvas.getContext('2d')!;

      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      setPagePreview(canvas.toDataURL());
    } catch (err) {
      console.error('Failed to render page preview:', err);
    }
  }, []);

  const handlePdfFile = useCallback(async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      // Check if PDF is encrypted
      const isEncrypted = await checkPDFEncryption(arrayBuffer);
      if (isEncrypted) {
        setError(`The file "${selectedFile.name}" is password protected. Use our Unlock PDF tool to remove the password first, then try again.`);
        return;
      }

      setPdfFile(selectedFile);
      setOutputFilename(selectedFile.name.replace('.pdf', '-redacted'));
      setError(null);
      setPageRedactions(new Map());
      setSelectedRedaction(null);

      const count = await getPDFPageCount(arrayBuffer);
      setPageCount(count);
      setCurrentPage(1);

      renderPagePreview(selectedFile, 1);
    } catch (err) {
      if (err instanceof EncryptedPDFError) {
        setError(err.message);
      } else {
        console.error('Failed to load PDF:', err);
        setError('Failed to load PDF file.');
      }
    }
  }, [renderPagePreview]);

  // When changing pages, render the new page
  useEffect(() => {
    if (pdfFile && currentPage) {
      renderPagePreview(pdfFile, currentPage);
      setSelectedRedaction(null);
    }
  }, [pdfFile, currentPage, renderPagePreview]);

  // Re-render preview on window resize
  useEffect(() => {
    const handleResize = () => {
      if (pdfFile && currentPage) {
        renderPagePreview(pdfFile, currentPage);
      }
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 250);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [pdfFile, currentPage, renderPagePreview]);

  const handlePdfDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingPdf(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handlePdfFile(droppedFile);
    },
    [handlePdfFile]
  );

  // Generate unique ID for redactions
  const generateId = () => `redact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Get client coordinates from mouse or touch event
  const getClientCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }, []);

  // Get position relative to canvas container
  const getRelativePosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 };
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const { clientX, clientY } = getClientCoords(e);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, [getClientCoords]);

  // Handle canvas click to start drawing or select
  const handleCanvasPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Don't start drawing if clicking on a redaction
    if ((e.target as HTMLElement).closest('.redaction-rect')) return;

    const pos = getRelativePosition(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setSelectedRedaction(null);
    setCurrentDrawRect({
      id: generateId(),
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
    });
  }, [getRelativePosition]);

  // Handle pointer move for drawing
  const handleCanvasPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasContainerRef.current) return;

    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    const { clientX, clientY } = getClientCoords(e);

    // Handle drawing new rectangle
    if (isDrawing && drawStart) {
      e.preventDefault();
      const currentX = clientX - containerRect.left;
      const currentY = clientY - containerRect.top;

      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);

      setCurrentDrawRect(prev => prev ? {
        ...prev,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.min(width, containerRect.width - x),
        height: Math.min(height, containerRect.height - y),
      } : null);
      return;
    }

    // Handle dragging existing redaction
    if (isDragging && selectedRedaction) {
      e.preventDefault();
      const newX = clientX - containerRect.left - dragOffset.x;
      const newY = clientY - containerRect.top - dragOffset.y;

      setPageRedactions(prev => {
        const newMap = new Map(prev);
        const rects = [...(newMap.get(currentPage) || [])];
        const idx = rects.findIndex(r => r.id === selectedRedaction);
        if (idx !== -1) {
          const rect = rects[idx];
          rects[idx] = {
            ...rect,
            x: Math.max(0, Math.min(newX, containerRect.width - rect.width)),
            y: Math.max(0, Math.min(newY, containerRect.height - rect.height)),
          };
          newMap.set(currentPage, rects);
        }
        return newMap;
      });
      return;
    }

    // Handle resizing
    if (resizeDirection && selectedRedaction) {
      e.preventDefault();
      const deltaX = clientX - resizeStart.x;
      const deltaY = clientY - resizeStart.y;

      setPageRedactions(prev => {
        const newMap = new Map(prev);
        const rects = [...(newMap.get(currentPage) || [])];
        const idx = rects.findIndex(r => r.id === selectedRedaction);
        if (idx !== -1) {
          let newWidth = initialSize.width;
          let newHeight = initialSize.height;
          let newX = initialSize.x;
          let newY = initialSize.y;

          switch (resizeDirection) {
            case 'e':
              newWidth = Math.max(20, Math.min(initialSize.width + deltaX, containerRect.width - initialSize.x));
              break;
            case 'w':
              newWidth = Math.max(20, initialSize.width - deltaX);
              newX = initialSize.x + (initialSize.width - newWidth);
              break;
            case 's':
              newHeight = Math.max(20, Math.min(initialSize.height + deltaY, containerRect.height - initialSize.y));
              break;
            case 'n':
              newHeight = Math.max(20, initialSize.height - deltaY);
              newY = initialSize.y + (initialSize.height - newHeight);
              break;
            case 'se':
              newWidth = Math.max(20, Math.min(initialSize.width + deltaX, containerRect.width - initialSize.x));
              newHeight = Math.max(20, Math.min(initialSize.height + deltaY, containerRect.height - initialSize.y));
              break;
            case 'sw':
              newWidth = Math.max(20, initialSize.width - deltaX);
              newHeight = Math.max(20, Math.min(initialSize.height + deltaY, containerRect.height - initialSize.y));
              newX = initialSize.x + (initialSize.width - newWidth);
              break;
            case 'ne':
              newWidth = Math.max(20, Math.min(initialSize.width + deltaX, containerRect.width - initialSize.x));
              newHeight = Math.max(20, initialSize.height - deltaY);
              newY = initialSize.y + (initialSize.height - newHeight);
              break;
            case 'nw':
              newWidth = Math.max(20, initialSize.width - deltaX);
              newHeight = Math.max(20, initialSize.height - deltaY);
              newX = initialSize.x + (initialSize.width - newWidth);
              newY = initialSize.y + (initialSize.height - newHeight);
              break;
          }

          newX = Math.max(0, newX);
          newY = Math.max(0, newY);

          rects[idx] = {
            ...rects[idx],
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          };
          newMap.set(currentPage, rects);
        }
        return newMap;
      });
    }
  }, [isDrawing, drawStart, isDragging, selectedRedaction, dragOffset, currentPage, resizeDirection, initialSize, resizeStart, getClientCoords]);

  // Handle pointer up
  const handleCanvasPointerUp = useCallback(() => {
    // Finish drawing
    if (isDrawing && currentDrawRect && currentDrawRect.width > 10 && currentDrawRect.height > 10) {
      setPageRedactions(prev => {
        const newMap = new Map(prev);
        const rects = [...(newMap.get(currentPage) || [])];
        rects.push(currentDrawRect);
        newMap.set(currentPage, rects);
        return newMap;
      });
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDrawRect(null);
    setIsDragging(false);
    setResizeDirection(null);
  }, [isDrawing, currentDrawRect, currentPage]);

  // Handle redaction click to select
  const handleRedactionClick = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    setSelectedRedaction(id);
  }, []);

  // Handle redaction drag start
  const handleRedactionDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, rect: RedactionRect) => {
    e.stopPropagation();
    setSelectedRedaction(rect.id);
    setIsDragging(true);
    const pos = getRelativePosition(e);
    setDragOffset({
      x: pos.x - rect.x,
      y: pos.y - rect.y,
    });
  }, [getRelativePosition]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection, rect: RedactionRect) => {
    e.stopPropagation();
    setSelectedRedaction(rect.id);
    setResizeDirection(direction);
    const { clientX, clientY } = getClientCoords(e);
    setResizeStart({ x: clientX, y: clientY });
    setInitialSize({
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y,
    });
  }, [getClientCoords]);

  // Delete selected redaction
  const deleteSelectedRedaction = useCallback(() => {
    if (!selectedRedaction) return;
    setPageRedactions(prev => {
      const newMap = new Map(prev);
      const rects = (newMap.get(currentPage) || []).filter(r => r.id !== selectedRedaction);
      if (rects.length > 0) {
        newMap.set(currentPage, rects);
      } else {
        newMap.delete(currentPage);
      }
      return newMap;
    });
    setSelectedRedaction(null);
  }, [selectedRedaction, currentPage]);

  // Clear all redactions on current page
  const clearCurrentPageRedactions = useCallback(() => {
    setPageRedactions(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentPage);
      return newMap;
    });
    setSelectedRedaction(null);
  }, [currentPage]);

  // Clear all redactions
  const clearAllRedactions = useCallback(() => {
    setPageRedactions(new Map());
    setSelectedRedaction(null);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRedaction) {
          e.preventDefault();
          deleteSelectedRedaction();
        }
      }
      if (e.key === 'Escape') {
        setSelectedRedaction(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRedaction, deleteSelectedRedaction]);

  // Apply redactions to PDF
  const handleApplyRedactions = useCallback(async () => {
    if (!pdfFile || pageRedactions.size === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const pdfBuffer = await pdfFile.arrayBuffer();

      // Convert screen coordinates to PDF coordinates for each page
      const redactionsForPdf: Array<{
        pageIndex: number;
        areas: Array<{ x: number; y: number; width: number; height: number }>;
      }> = [];

      for (const [pageNum, rects] of pageRedactions.entries()) {
        const areas = rects.map(rect => ({
          x: rect.x / scaleFactor,
          y: pageHeight - (rect.y / scaleFactor) - (rect.height / scaleFactor),
          width: rect.width / scaleFactor,
          height: rect.height / scaleFactor,
        }));
        redactionsForPdf.push({
          pageIndex: pageNum - 1, // 0-indexed
          areas,
        });
      }

      const resultData = await applyRedactions(pdfBuffer, redactionsForPdf, redactionStyle);
      const filename = outputFilename.trim() || `redacted-${pdfFile.name.replace('.pdf', '')}`;
      showPreview(resultData, `${filename}.pdf`);
    } catch (err) {
      console.error('Failed to apply redactions:', err);
      setError('Failed to apply redactions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [pdfFile, pageRedactions, scaleFactor, pageHeight, outputFilename, showPreview, redactionStyle]);

  const clearAll = useCallback(() => {
    setPdfFile(null);
    setPagePreview(null);
    setPageRedactions(new Map());
    setSelectedRedaction(null);
    setError(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  }, []);

  // Get list of pages with redactions
  const pagesWithRedactions = Array.from(pageRedactions.keys()).sort((a, b) => a - b);
  const totalRedactions = Array.from(pageRedactions.values()).reduce((sum, rects) => sum + rects.length, 0);

  return (
    <PageLayout>
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
      />
      <div className="w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                <rect x="8" y="7" width="8" height="3" fill="currentColor" opacity="0.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('pageTitle')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t('pageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: Upload Controls */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="card p-4 space-y-4 lg:sticky lg:top-24">
              {/* PDF Dropzone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  1. Select PDF File
                </label>
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  onDrop={handlePdfDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingPdf(false); }}
                  className={`dropzone py-4 ${isDraggingPdf ? 'dropzone-active' : ''}`}
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => e.target.files?.[0] && handlePdfFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    {pdfFile ? (
                      <p className="text-gray-700 dark:text-gray-200 font-medium text-sm truncate max-w-full px-2">{pdfFile.name}</p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Drop PDF or click to browse</p>
                    )}
                  </div>
                </div>
              </div>

              {pdfFile && pagePreview && (
                <>
                  {/* Instructions */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Draw</strong> rectangles to redact. <strong>Click</strong> to select. <strong>Drag</strong> to move. <strong>Delete</strong> key to remove.
                    </p>
                  </div>

                  {/* Redaction Style Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      2. Redaction Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {redactionStyles.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setRedactionStyle(style.value)}
                          className={`relative p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                            redactionStyle === style.value
                              ? 'border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-700'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="h-6 bg-black rounded flex items-center justify-center mb-1">
                            {style.preview && (
                              <span className="text-white text-[8px] font-bold tracking-wide truncate px-1">
                                {style.preview}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Navigation */}
                  {pageCount > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Page ({currentPage} of {pageCount})
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="btn btn-secondary px-3 py-1 text-sm"
                        >
                          Prev
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={pageCount}
                          value={currentPage}
                          onChange={(e) => setCurrentPage(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                          className="flex-1 px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-center"
                        />
                        <button
                          onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                          disabled={currentPage === pageCount}
                          className="btn btn-secondary px-3 py-1 text-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Current page redactions */}
                  {currentRedactions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Redactions on Page {currentPage} ({currentRedactions.length})
                        </label>
                        <button
                          onClick={clearCurrentPageRedactions}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                        >
                          Clear Page
                        </button>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {currentRedactions.map((rect, idx) => (
                          <div
                            key={rect.id}
                            onClick={() => setSelectedRedaction(rect.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                              selectedRedaction === rect.id
                                ? 'bg-gray-200 dark:bg-gray-700'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-150 dark:hover:bg-gray-750'
                            }`}
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              Area {idx + 1}: {Math.round(rect.width)}x{Math.round(rect.height)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRedaction(rect.id);
                                deleteSelectedRedaction();
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pages with redactions summary */}
                  {pagesWithRedactions.length > 0 && (
                    <div className="p-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <p className="text-xs text-gray-800 dark:text-gray-200 mb-2 font-medium">
                        {totalRedactions} redaction(s) on {pagesWithRedactions.length} page(s):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {pagesWithRedactions.map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 py-1 text-xs rounded ${
                              pageNum === currentPage
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            Page {pageNum} ({pageRedactions.get(pageNum)?.length || 0})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Output filename */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Output filename
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={outputFilename}
                        onChange={(e) => setOutputFilename(e.target.value)}
                        placeholder="redacted-document"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                        .pdf
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={clearAll} className="btn btn-ghost flex-1 text-sm text-red-600">
                      Clear All
                    </button>
                    {totalRedactions > 0 && (
                      <button onClick={clearAllRedactions} className="btn btn-ghost flex-1 text-sm text-orange-600">
                        Clear Redactions
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleApplyRedactions}
                    disabled={isProcessing || totalRedactions === 0}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? 'Processing...' : `Apply ${totalRedactions} Redaction(s) & Preview`}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Interactive Canvas */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {pagePreview ? (
              <div className="card p-3 sm:p-4 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Draw redaction areas on page {currentPage}
                  </h3>
                  {currentRedactions.length > 0 && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                      {currentRedactions.length} redaction(s)
                    </span>
                  )}
                </div>
                <div
                  ref={canvasContainerRef}
                  className="relative inline-block border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden cursor-crosshair select-none max-w-full"
                  onMouseDown={handleCanvasPointerDown}
                  onMouseMove={handleCanvasPointerMove}
                  onMouseUp={handleCanvasPointerUp}
                  onMouseLeave={handleCanvasPointerUp}
                  onTouchStart={handleCanvasPointerDown}
                  onTouchMove={handleCanvasPointerMove}
                  onTouchEnd={handleCanvasPointerUp}
                  onTouchCancel={handleCanvasPointerUp}
                >
                  {/* PDF Page Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pagePreview}
                    alt="PDF Page"
                    className="block max-w-full h-auto"
                    draggable={false}
                  />

                  {/* Current drawing rectangle */}
                  {currentDrawRect && currentDrawRect.width > 0 && currentDrawRect.height > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: currentDrawRect.x,
                        top: currentDrawRect.y,
                        width: currentDrawRect.width,
                        height: currentDrawRect.height,
                      }}
                      className="bg-black/80 border-2 border-dashed border-white pointer-events-none flex items-center justify-center overflow-hidden"
                    >
                      {getStyleText(redactionStyle) && (
                        <span className="text-white font-bold tracking-wider text-xs whitespace-nowrap">
                          {getStyleText(redactionStyle)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Existing redaction rectangles */}
                  {currentRedactions.map((rect) => (
                    <div
                      key={rect.id}
                      style={{
                        position: 'absolute',
                        left: rect.x,
                        top: rect.y,
                        width: rect.width,
                        height: rect.height,
                      }}
                      className={`redaction-rect bg-black cursor-move touch-none flex items-center justify-center overflow-hidden ${
                        selectedRedaction === rect.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                      }`}
                      onClick={(e) => handleRedactionClick(e, rect.id)}
                      onMouseDown={(e) => handleRedactionDragStart(e, rect)}
                      onTouchStart={(e) => handleRedactionDragStart(e, rect)}
                    >
                      {getStyleText(redactionStyle) && (
                        <span className="text-white font-bold tracking-wider text-xs whitespace-nowrap pointer-events-none select-none">
                          {getStyleText(redactionStyle)}
                        </span>
                      )}
                      {/* Resize handles (only show when selected) */}
                      {selectedRedaction === rect.id && (
                        <>
                          {/* Corner handles */}
                          <div
                            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-sm cursor-nw-resize hover:bg-blue-600 touch-none"
                            onMouseDown={(e) => handleResizeStart(e, 'nw', rect)}
                            onTouchStart={(e) => handleResizeStart(e, 'nw', rect)}
                          />
                          <div
                            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-sm cursor-ne-resize hover:bg-blue-600 touch-none"
                            onMouseDown={(e) => handleResizeStart(e, 'ne', rect)}
                            onTouchStart={(e) => handleResizeStart(e, 'ne', rect)}
                          />
                          <div
                            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-sm cursor-sw-resize hover:bg-blue-600 touch-none"
                            onMouseDown={(e) => handleResizeStart(e, 'sw', rect)}
                            onTouchStart={(e) => handleResizeStart(e, 'sw', rect)}
                          />
                          <div
                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-sm cursor-se-resize hover:bg-blue-600 touch-none"
                            onMouseDown={(e) => handleResizeStart(e, 'se', rect)}
                            onTouchStart={(e) => handleResizeStart(e, 'se', rect)}
                          />
                          {/* Edge handles */}
                          <div
                            className="absolute top-1/2 -left-2 w-3 h-6 -translate-y-1/2 bg-blue-500 rounded-sm cursor-w-resize hover:bg-blue-600 touch-none"
                            onMouseDown={(e) => handleResizeStart(e, 'w', rect)}
                            onTouchStart={(e) => handleResizeStart(e, 'w', rect)}
                          />
                          <div
                            className="absolute top-1/2 -right-2 w-3 h-6 -translate-y-1/2 bg-blue-500 rounded-sm cursor-e-resize hover:bg-blue-600 touch-none"
                            onMouseDown={(e) => handleResizeStart(e, 'e', rect)}
                            onTouchStart={(e) => handleResizeStart(e, 'e', rect)}
                          />
                          <div
                            className="absolute -top-2 left-1/2 w-6 h-3 -translate-x-1/2 bg-blue-500 rounded-sm cursor-n-resize hover:bg-blue-600 touch-none"
                            onMouseDown={(e) => handleResizeStart(e, 'n', rect)}
                            onTouchStart={(e) => handleResizeStart(e, 'n', rect)}
                          />
                          <div
                            className="absolute -bottom-2 left-1/2 w-6 h-3 -translate-x-1/2 bg-blue-500 rounded-sm cursor-s-resize hover:bg-blue-600 touch-none"
                            onMouseDown={(e) => handleResizeStart(e, 's', rect)}
                            onTouchStart={(e) => handleResizeStart(e, 's', rect)}
                          />
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSelectedRedaction();
                            }}
                            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Redact PDF Content
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF to start drawing black redaction boxes over sensitive information.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
