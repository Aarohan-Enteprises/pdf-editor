'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { usePDFDocument, PageLimitError, EncryptedPDFError } from '@/hooks/usePDFDocument';
import { mergePDFsWithOrder, downloadPDF } from '@/lib/pdf-operations';

export default function DeletePagesPage() {
  const t = useTranslations('tools.deletePages');
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
  } = usePDFDocument();

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('document-edited');

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setUploadError(null);
      try {
        await addFiles(selectedFiles);
        if (selectedFiles.length > 0) {
          setOutputFilename(selectedFiles[0].name.replace('.pdf', '-edited'));
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

  const handleDeleteSelected = useCallback(async () => {
    if (pages.length === 0 || files.length === 0 || selectedPages.size === 0) return;
    if (selectedPages.size === pages.length) {
      setUploadError('Cannot delete all pages. At least one page must remain.');
      return;
    }

    setIsProcessing(true);
    try {
      // Get pages that are NOT selected (keep these)
      const pagesToKeep = pages.filter((page) => !selectedPages.has(page.id));
      const resultData = await mergePDFsWithOrder(files.map((f) => f.data), pagesToKeep);
      const filename = outputFilename.trim() || 'document-edited';
      downloadPDF(resultData, `${filename}.pdf`);
    } catch (error) {
      console.error('Failed to delete pages:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, pages, selectedPages, outputFilename]);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
            <div className="card p-4 sticky top-24 space-y-4">
              <PDFDropzone
                onFilesSelected={handleFilesSelected}
                isLoading={isLoading}
                externalError={uploadError}
                onClearError={() => setUploadError(null)}
              />

              {pages.length > 0 && (
                <>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Select pages you want to <strong>delete</strong>, then click the button below.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={selectAllPages}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      {tCommon('selectAll')}
                    </button>
                    <button
                      onClick={deselectAllPages}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      {tCommon('deselectAll')}
                    </button>
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
                        placeholder="document-edited"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                        .pdf
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={clearAll}
                    className="btn btn-ghost w-full text-sm text-red-600 dark:text-red-400"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isProcessing || selectedPages.size === 0}
                    className="btn btn-primary w-full bg-red-600 hover:bg-red-700"
                  >
                    {isProcessing ? 'Processing...' : `Delete ${selectedPages.size} Page(s) & Download`}
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
                  {selectedPages.size > 0 && (
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {selectedPages.size} selected for deletion
                    </span>
                  )}
                </div>
                <PDFViewer
                  files={files}
                  pages={pages}
                  selectedPages={selectedPages}
                  onToggleSelection={togglePageSelection}
                  onReorder={reorderPages}
                  onRotate={rotatePage}
                  onDelete={removePage}
                  onThumbnailLoad={updatePageThumbnail}
                />
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PDF added yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF file to delete pages from it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
