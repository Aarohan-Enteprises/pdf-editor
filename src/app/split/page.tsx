'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFDocument, PageLimitError, EncryptedPDFError } from '@/hooks/usePDFDocument';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { mergePDFsWithOrder, splitPDF, downloadPDF } from '@/lib/pdf-operations';

interface PageRange {
  id: string;
  from: number;
  to: number;
}

type SplitMode = 'select' | 'ranges' | 'fixed';

// Colors for range visualization
const RANGE_COLORS = [
  { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600 dark:text-orange-400', light: 'bg-orange-100 dark:bg-orange-900/30' },
  { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600 dark:text-blue-400', light: 'bg-blue-100 dark:bg-blue-900/30' },
  { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-600 dark:text-green-400', light: 'bg-green-100 dark:bg-green-900/30' },
  { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400', light: 'bg-purple-100 dark:bg-purple-900/30' },
  { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-600 dark:text-pink-400', light: 'bg-pink-100 dark:bg-pink-900/30' },
  { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', light: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', light: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600 dark:text-red-400', light: 'bg-red-100 dark:bg-red-900/30' },
];

export default function SplitPage() {
  const t = useTranslations('tools.split');
  const tDropzone = useTranslations('dropzone');
  const tCommon = useTranslations('common');

  const {
    files,
    pages,
    selectedPages,
    isLoading,
    addFiles,
    removePage,
    reorderPages,
    rotatePage,
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    updatePageThumbnail,
    clearAll,
    getSelectedPageIndices,
  } = usePDFDocument();

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>('select');

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  // Range mode state
  const [ranges, setRanges] = useState<PageRange[]>([
    { id: '1', from: 1, to: 1 }
  ]);

  // Fixed range mode state
  const [fixedSize, setFixedSize] = useState(5);

  // Output filename
  const [outputFilename, setOutputFilename] = useState('split');

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setUploadError(null);
      try {
        await addFiles(selectedFiles);
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

  // Extract selected pages
  const handleExtractSelected = useCallback(async () => {
    if (selectedPages.size === 0 || files.length === 0) return;
    setIsProcessing(true);
    try {
      const selectedIndices = getSelectedPageIndices();
      const mergedData = await mergePDFsWithOrder(files.map((f) => f.data), pages);
      const splitData = await splitPDF(mergedData, selectedIndices);
      const filename = outputFilename.trim() || 'extracted-pages';
      showPreview(splitData, `${filename}.pdf`);
    } catch (error) {
      console.error('Failed to extract pages:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, pages, selectedPages, getSelectedPageIndices, outputFilename, showPreview]);

  // Split by custom ranges
  const handleSplitByRanges = useCallback(async () => {
    if (files.length === 0 || ranges.length === 0) return;
    setIsProcessing(true);
    try {
      const mergedData = await mergePDFsWithOrder(files.map((f) => f.data), pages);
      const filename = outputFilename.trim() || 'split';

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const fromIndex = Math.max(0, range.from - 1);
        const toIndex = Math.min(pages.length - 1, range.to - 1);

        if (fromIndex <= toIndex) {
          const pageIndices = Array.from(
            { length: toIndex - fromIndex + 1 },
            (_, idx) => fromIndex + idx
          );
          const splitData = await splitPDF(mergedData, pageIndices);
          downloadPDF(splitData, `${filename}-pages-${range.from}-to-${range.to}.pdf`);

          // Small delay between downloads
          if (i < ranges.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
    } catch (error) {
      console.error('Failed to split by ranges:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, pages, ranges, outputFilename]);

  // Split by fixed size
  const handleSplitByFixedSize = useCallback(async () => {
    if (files.length === 0 || fixedSize < 1) return;
    setIsProcessing(true);
    try {
      const mergedData = await mergePDFsWithOrder(files.map((f) => f.data), pages);
      const totalPages = pages.length;
      const chunks = Math.ceil(totalPages / fixedSize);
      const filename = outputFilename.trim() || 'split';

      for (let i = 0; i < chunks; i++) {
        const startPage = i * fixedSize;
        const endPage = Math.min(startPage + fixedSize - 1, totalPages - 1);
        const pageIndices = Array.from(
          { length: endPage - startPage + 1 },
          (_, idx) => startPage + idx
        );

        const splitData = await splitPDF(mergedData, pageIndices);
        downloadPDF(splitData, `${filename}-part-${i + 1}.pdf`);

        if (i < chunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error('Failed to split by fixed size:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, pages, fixedSize, outputFilename]);

  // Range management
  const addRange = useCallback(() => {
    const lastRange = ranges[ranges.length - 1];
    const newFrom = lastRange ? Math.min(lastRange.to + 1, pages.length) : 1;
    const newTo = Math.min(newFrom, pages.length);
    setRanges(prev => [
      ...prev,
      { id: Date.now().toString(), from: newFrom, to: newTo }
    ]);
  }, [ranges, pages.length]);

  const removeRange = useCallback((id: string) => {
    setRanges(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRange = useCallback((id: string, field: 'from' | 'to', value: number) => {
    setRanges(prev => prev.map(r => {
      if (r.id === id) {
        const newValue = Math.max(1, Math.min(pages.length, value));
        if (field === 'from') {
          return { ...r, from: newValue, to: Math.max(newValue, r.to) };
        } else {
          return { ...r, to: newValue, from: Math.min(newValue, r.from) };
        }
      }
      return r;
    }));
  }, [pages.length]);

  // Calculate chunks for fixed size preview
  const fixedChunks = pages.length > 0 ? Math.ceil(pages.length / fixedSize) : 0;

  // Get pages grouped by range for visualization
  const getRangeGroups = useCallback(() => {
    return ranges.map((range, index) => {
      const rangePages = [];
      for (let p = range.from; p <= range.to && p <= pages.length; p++) {
        const pageIndex = p - 1;
        if (pages[pageIndex]) {
          rangePages.push({ ...pages[pageIndex], pageNum: p });
        }
      }
      return {
        range,
        index,
        color: RANGE_COLORS[index % RANGE_COLORS.length],
        pages: rangePages,
      };
    });
  }, [ranges, pages]);

  return (
    <PageLayout>
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
      />
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
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
              />

              {pages.length > 0 && (
                <>
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
                        placeholder="split"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                        .pdf
                      </span>
                    </div>
                  </div>

                  {/* Split Mode Tabs */}
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <button
                      onClick={() => setSplitMode('select')}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        splitMode === 'select'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      Select
                    </button>
                    <button
                      onClick={() => setSplitMode('ranges')}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        splitMode === 'ranges'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      Ranges
                    </button>
                    <button
                      onClick={() => setSplitMode('fixed')}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        splitMode === 'fixed'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      Fixed
                    </button>
                  </div>

                  {/* Select Mode */}
                  {splitMode === 'select' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Click on pages to select them, then extract as a new PDF.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllPages}
                          className="btn btn-secondary flex-1 text-xs"
                        >
                          {tCommon('selectAll')}
                        </button>
                        <button
                          onClick={deselectAllPages}
                          className="btn btn-secondary flex-1 text-xs"
                        >
                          {tCommon('deselectAll')}
                        </button>
                      </div>
                      <button
                        onClick={handleExtractSelected}
                        disabled={isProcessing || selectedPages.size === 0}
                        className="btn btn-primary w-full"
                      >
                        {isProcessing ? 'Processing...' : `Extract & Preview ${selectedPages.size} page(s)`}
                      </button>
                    </div>
                  )}

                  {/* Ranges Mode */}
                  {splitMode === 'ranges' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Define custom page ranges. Each range becomes a separate PDF.
                      </p>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {ranges.map((range, index) => (
                          <div key={range.id} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Range {index + 1}
                              </span>
                              {ranges.length > 1 && (
                                <button
                                  onClick={() => removeRange(range.id)}
                                  className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                                <select
                                  value={range.from}
                                  onChange={(e) => updateRange(range.id, 'from', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                >
                                  {Array.from({ length: pages.length }, (_, i) => i + 1).map((pageNum) => (
                                    <option key={pageNum} value={pageNum}>
                                      Page {pageNum}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-end pb-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                                <select
                                  value={range.to}
                                  onChange={(e) => updateRange(range.id, 'to', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                >
                                  {Array.from({ length: pages.length }, (_, i) => i + 1).map((pageNum) => (
                                    <option key={pageNum} value={pageNum}>
                                      Page {pageNum}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {range.to - range.from + 1} page(s)
                            </p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={addRange}
                        className="btn btn-secondary w-full text-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Range
                      </button>

                      <button
                        onClick={handleSplitByRanges}
                        disabled={isProcessing || ranges.length === 0}
                        className="btn btn-primary w-full"
                      >
                        {isProcessing ? 'Processing...' : `Split into ${ranges.length} PDF(s)`}
                      </button>
                    </div>
                  )}

                  {/* Fixed Size Mode */}
                  {splitMode === 'fixed' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Split into equal parts with a fixed number of pages each.
                      </p>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pages per file
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={pages.length}
                          value={fixedSize}
                          onChange={(e) => setFixedSize(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          This will create <strong>{fixedChunks}</strong> PDF file(s)
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {fixedChunks > 0 && (
                            <>
                              {Array.from({ length: Math.min(fixedChunks, 3) }, (_, i) => {
                                const start = i * fixedSize + 1;
                                const end = Math.min((i + 1) * fixedSize, pages.length);
                                return `Part ${i + 1}: pages ${start}-${end}`;
                              }).join(', ')}
                              {fixedChunks > 3 && `, ... and ${fixedChunks - 3} more`}
                            </>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={handleSplitByFixedSize}
                        disabled={isProcessing || fixedSize < 1}
                        className="btn btn-primary w-full"
                      >
                        {isProcessing ? 'Processing...' : `Split into ${fixedChunks} PDF(s)`}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={clearAll}
                    className="btn btn-ghost w-full text-sm text-red-600 dark:text-red-400"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: PDF Viewer */}
          <div className="lg:col-span-2">
            {pages.length > 0 ? (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {pages.length} pages
                  </h2>
                  {splitMode === 'select' && selectedPages.size > 0 && (
                    <span className="text-sm text-orange-600 dark:text-orange-400">
                      {selectedPages.size} selected
                    </span>
                  )}
                  {splitMode === 'ranges' && ranges.length > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {ranges.length} range(s) defined
                    </span>
                  )}
                </div>

                {/* Ranges Mode - Show pages grouped by range */}
                {splitMode === 'ranges' ? (
                  <div className="space-y-6">
                    {getRangeGroups().map((group) => (
                      <div key={group.range.id} className={`p-4 rounded-xl ${group.color.light}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-3 h-3 rounded-full ${group.color.bg}`} />
                          <h3 className={`font-medium ${group.color.text}`}>
                            Range {group.index + 1}: Pages {group.range.from} - {group.range.to}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({group.pages.length} page{group.pages.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {group.pages.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                            {group.pages.map((page) => (
                              <div
                                key={page.id}
                                className={`relative aspect-[3/4] bg-white dark:bg-slate-800 rounded-lg overflow-hidden border-2 ${group.color.border} shadow-sm`}
                              >
                                {page.thumbnail ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={page.thumbnail}
                                    alt={`Page ${page.pageNum}`}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                                <div className="absolute bottom-1 left-1 right-1">
                                  <span className={`inline-block px-1.5 py-0.5 ${group.color.bg} rounded text-xs text-white font-medium`}>
                                    {page.pageNum}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No pages in this range
                          </p>
                        )}
                      </div>
                    ))}

                    {ranges.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Add ranges to see page groupings</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Select/Fixed Mode - Use standard PDFViewer */
                  <PDFViewer
                    files={files}
                    pages={pages}
                    selectedPages={splitMode === 'select' ? selectedPages : new Set()}
                    onToggleSelection={splitMode === 'select' ? togglePageSelection : () => {}}
                    onReorder={reorderPages}
                    onRotate={rotatePage}
                    onDelete={removePage}
                    onThumbnailLoad={updatePageThumbnail}
                  />
                )}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PDF added yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF file to split it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
