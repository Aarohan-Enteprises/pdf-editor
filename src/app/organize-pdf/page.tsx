'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFDocument, PageLimitError, EncryptedPDFError } from '@/hooks/usePDFDocument';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { mergePDFsWithOrder } from '@/lib/pdf-operations';
import type { PageInfo } from '@/lib/pdf-operations';
import Link from 'next/link';
import { ToolSEOSection } from '@/components/ToolSEOSection';

// --- Inline sub-components ---

function InsertionIndicator({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 self-center px-1 cursor-pointer"
      title="Place selected pages here"
    >
      <div className="w-9 h-9 rounded-full bg-cyan-500 dark:bg-cyan-400 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-150">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </button>
  );
}

function OrganizeThumbnail({
  page,
  fileData,
  selectionNumber,
  isSelected,
  onToggleSelect,
}: {
  page: PageInfo;
  fileData: ArrayBuffer;
  selectionNumber: number | null;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { renderPageToCanvas } = await import('@/lib/pdf-renderer');
        const dataUrl = await renderPageToCanvas(fileData, page.pageIndex + 1, {
          maxWidth: 180,
          maxHeight: 250,
        });
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          setRendered(true);
        };
        img.src = dataUrl;
      } catch {
        // ignore render errors
      }
    })();
    return () => { cancelled = true; };
  }, [fileData, page.pageIndex]);

  return (
    <div
      className={`w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] md:w-[calc(25%-12px)] flex-shrink-0`}
    >
      <div
        onClick={onToggleSelect}
        className={`relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 scale-[0.96] opacity-75'
            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md'
        }`}
      >
        {/* Selection badge */}
        {selectionNumber !== null && (
          <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
            {selectionNumber}
          </div>
        )}

        {/* Thumbnail */}
        <div className="aspect-[3/4] flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-2">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
          />
          {!rendered && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Page label */}
        <div className="px-2 py-1.5 text-center border-t border-gray-100 dark:border-slate-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {page.pageIndex + 1}
          </span>
        </div>

      </div>
    </div>
  );
}

// --- Main page component ---

export default function OrganizePDFPage() {
  const t = useTranslations('tools.organizePdf');
  const tDropzone = useTranslations('dropzone');
  const {
    files,
    pages,
    isLoading,
    addFiles,
    clearAll,
  } = usePDFDocument();

  const [orderedPages, setOrderedPages] = useState<PageInfo[]>([]);
  const [selectionOrder, setSelectionOrder] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('document-organized');

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  const selectedPagesSet = new Set(selectionOrder);
  const hasSelection = selectionOrder.length > 0;

  // Sync orderedPages from hook pages whenever pages change
  useEffect(() => {
    setOrderedPages(pages);
    setSelectionOrder([]);
  }, [pages]);

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setUploadError(null);
      try {
        await addFiles(selectedFiles);
        if (selectedFiles.length > 0) {
          setOutputFilename(selectedFiles[0].name.replace('.pdf', '-organized'));
        }
      } catch (error) {
        if (error instanceof PageLimitError) {
          setUploadError(tDropzone('tooManyPages'));
        } else if (error instanceof EncryptedPDFError) {
          setUploadError(error.message);
        } else {
          console.error('Failed to load files:', error);
        }
      }
    },
    [addFiles, tDropzone]
  );

  const toggleSelection = useCallback((pageId: string) => {
    setSelectionOrder((prev) => {
      if (prev.includes(pageId)) {
        return prev.filter((id) => id !== pageId);
      }
      return [...prev, pageId];
    });
  }, []);

  const movePagesToPosition = useCallback((targetIndex: number) => {
    setOrderedPages((prev) => {
      const selectedSet = new Set(selectionOrder);
      const selectedPages = prev.filter((p) => selectedSet.has(p.id));
      const nonSelected = prev.filter((p) => !selectedSet.has(p.id));
      const result = [...nonSelected];
      result.splice(targetIndex, 0, ...selectedPages);
      return result;
    });
    setSelectionOrder([]);
  }, [selectionOrder]);

  const handleOrganize = useCallback(async () => {
    if (orderedPages.length === 0 || files.length === 0) return;

    setIsProcessing(true);
    try {
      const resultData = await mergePDFsWithOrder(
        files.map((f) => f.data),
        orderedPages
      );
      const filename = outputFilename.trim() || 'document-organized';
      showPreview(resultData, `${filename}.pdf`);
    } catch (error) {
      console.error('Failed to organize PDF:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, orderedPages, outputFilename, showPreview]);

  const handleClearAll = useCallback(() => {
    clearAll();
    setOrderedPages([]);
    setSelectionOrder([]);
    setOutputFilename('document-organized');
  }, [clearAll]);

  // Build the interleaved grid: for non-selected pages, place insertion indicators between them
  const nonSelectedPages = orderedPages.filter((p) => !selectedPagesSet.has(p.id));

  const getFileData = (page: PageInfo): ArrayBuffer | null => {
    const file = files[page.sourceIndex];
    return file ? file.data : null;
  };

  return (
    <PageLayout>
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
        currentTool="organize-pdf"
      />
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Tools
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('pageTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('pageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Dropzone & Controls */}
          <div className="lg:col-span-1">
            <div className="card p-4 lg:sticky lg:top-24 space-y-4">
              <PDFDropzone
                onFilesSelected={handleFilesSelected}
                isLoading={isLoading}
                externalError={uploadError}
                onClearError={() => setUploadError(null)}
                fileLoaded={files.length > 0}
                fileName={files[0]?.name}
              />

              {orderedPages.length > 0 && (
                <>
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                    <p className="text-sm text-cyan-800 dark:text-cyan-200">
                      <strong>1.</strong> Click pages to select them.<br />
                      <strong>2.</strong> Click a <strong>&ldquo;Place here&rdquo;</strong> card to move them.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Output filename
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={outputFilename}
                        onChange={(e) => setOutputFilename(e.target.value)}
                        placeholder="document-organized"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                        .pdf
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleClearAll}
                    className="btn btn-ghost w-full text-sm text-red-600 dark:text-red-400"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleOrganize}
                    disabled={isProcessing || orderedPages.length === 0}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Organize & Preview'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Page Grid */}
          <div className="lg:col-span-2">
            {orderedPages.length > 0 ? (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {orderedPages.length} pages
                  </h2>
                  {hasSelection && (
                    <span className="text-sm text-cyan-600 dark:text-cyan-400">
                      {selectionOrder.length} selected
                    </span>
                  )}
                </div>

                {/* Flex-wrap grid with interleaved insertion indicators */}
                <div className="flex flex-wrap items-stretch gap-y-4">
                  {/* Leading insertion indicator */}
                  {hasSelection && (
                    <InsertionIndicator onClick={() => movePagesToPosition(0)} />
                  )}

                  {orderedPages.map((page) => {
                    const isSelected = selectedPagesSet.has(page.id);
                    const selIdx = selectionOrder.indexOf(page.id);
                    const selectionNumber = selIdx >= 0 ? selIdx + 1 : null;
                    const fileData = getFileData(page);
                    if (!fileData) return null;

                    // For non-selected pages, compute insertion index for the indicator after this page
                    const nonSelIdx = nonSelectedPages.indexOf(page);

                    return (
                      <span key={page.id} className="contents">
                        <OrganizeThumbnail
                          page={page}
                          fileData={fileData}
                          selectionNumber={selectionNumber}
                          isSelected={isSelected}
                          onToggleSelect={() => toggleSelection(page.id)}
                        />
                        {/* Show insertion indicator after each non-selected page */}
                        {hasSelection && !isSelected && (
                          <InsertionIndicator
                            onClick={() => movePagesToPosition(nonSelIdx + 1)}
                          />
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PDF added yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF file to organize and rearrange its pages
                </p>
              </div>
            )}
          </div>
        </div>
        <ToolSEOSection toolId="organize-pdf" />
      </div>
    </PageLayout>
  );
}
