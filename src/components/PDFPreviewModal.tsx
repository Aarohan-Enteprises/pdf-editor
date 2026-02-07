'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import * as pdfjsLib from 'pdfjs-dist';
import { toolSuggestions, slugToToolId } from '@/lib/tools-data';

// Set worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  pdfData: Uint8Array | null;
  filename: string;
  onClose: () => void;
  onDownload: () => void;
  currentTool?: string;
}

interface PagePreview {
  pageNum: number;
  dataUrl: string;
  width: number;
  height: number;
}

export function PDFPreviewModal({
  isOpen,
  pdfData,
  filename,
  onClose,
  onDownload,
  currentTool,
}: PDFPreviewModalProps) {
  const tTools = useTranslations('tools');
  const suggestions = currentTool ? toolSuggestions[currentTool] : undefined;
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 50));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100);
  }, []);

  // Render PDF pages
  useEffect(() => {
    if (!isOpen || !pdfData) {
      setPages([]);
      return;
    }

    const renderPages = async () => {
      setIsLoading(true);
      setError(null);
      setPages([]);

      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfData) }).promise;
        const totalPages = pdf.numPages;
        const renderedPages: PagePreview[] = [];

        // Calculate scale based on screen size - larger for vertical scroll view
        const isMobile = window.innerWidth < 768;
        const maxWidth = isMobile ? window.innerWidth - 64 : 600;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });

          const scale = Math.min(maxWidth / viewport.width, 2);
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          const ctx = canvas.getContext('2d')!;

          await page.render({
            canvasContext: ctx,
            viewport: scaledViewport,
          }).promise;

          renderedPages.push({
            pageNum: i,
            dataUrl: canvas.toDataURL(),
            width: scaledViewport.width,
            height: scaledViewport.height,
          });
        }

        setPages(renderedPages);
        setCurrentPage(1);
        pageRefs.current = new Array(totalPages).fill(null);
      } catch (err) {
        console.error('Failed to render PDF preview:', err);
        setError('Failed to load PDF preview');
      } finally {
        setIsLoading(false);
      }
    };

    renderPages();
  }, [isOpen, pdfData]);

  // Track current page based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || pages.length === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 3;

      for (let i = 0; i < pageRefs.current.length; i++) {
        const pageEl = pageRefs.current[i];
        if (pageEl) {
          const pageRect = pageEl.getBoundingClientRect();
          if (pageRect.top <= containerCenter && pageRect.bottom > containerCenter) {
            setCurrentPage(i + 1);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pages]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  }, [onClose]);

  const scrollToPage = useCallback((pageNum: number) => {
    const pageEl = pageRefs.current[pageNum - 1];
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {filename}
            </h2>
            {pages.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {pages.length}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Zoom controls */}
            {pages.length > 0 && (
              <div className="flex items-center gap-1 mr-1 sm:mr-2">
                <button
                  onClick={zoomOut}
                  disabled={zoom <= 50}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <button
                  onClick={resetZoom}
                  className="px-2 py-1 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors min-w-[3rem]"
                  title="Reset zoom"
                >
                  {zoom}%
                </button>
                <button
                  onClick={zoomIn}
                  disabled={zoom >= 200}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Divider */}
            {pages.length > 0 && (
              <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-slate-600 mx-1" />
            )}

            {/* Page jump input for multi-page docs */}
            {pages.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 mr-2">
                <input
                  type="number"
                  min={1}
                  max={pages.length}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= pages.length) {
                      scrollToPage(page);
                    }
                  }}
                  className="w-14 px-2 py-1 text-sm text-center border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">/ {pages.length}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-900"
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!isLoading && !error && pages.length > 0 && (
            <div
              className="inline-block min-w-full py-4 sm:py-6"
              style={{
                minWidth: zoom > 100 ? `${zoom}%` : '100%'
              }}
            >
              <div className="space-y-4 sm:space-y-6">
                {pages.map((page, index) => (
                  <div
                    key={page.pageNum}
                    ref={(el) => { pageRefs.current[index] = el; }}
                    className="flex flex-col items-center"
                  >
                    {/* Page container with shadow */}
                    <div
                      className="relative bg-white shadow-lg rounded-sm overflow-hidden"
                      style={{
                        width: page.width * (zoom / 100),
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNum}`}
                        className="w-full h-auto"
                        draggable={false}
                      />
                    </div>
                    {/* Page number indicator */}
                    <div className="mt-2 px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                      {page.pageNum}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1 sm:flex-none"
            >
              Close
            </button>
            <button
              onClick={onDownload}
              disabled={isLoading}
              className="btn btn-primary flex-1 sm:flex-none sm:ml-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>

          {/* What's Next Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700/50">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                What&apos;s next?
              </span>
              {suggestions.map((slug) => {
                const toolId = slugToToolId[slug];
                if (!toolId) return null;
                return (
                  <Link
                    key={slug}
                    href={`/${slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {tTools(`${toolId}.title`)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
