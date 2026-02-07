'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { checkPDFEncryption, EncryptedPDFError } from '@/lib/pdf-operations';
import * as pdfjsLib from 'pdfjs-dist';
import Link from 'next/link';
import { ToolSEOSection } from '@/components/ToolSEOSection';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PageImage {
  pageNumber: number;
  dataUrl: string;
}

type ImageFormat = 'jpeg' | 'png' | 'webp';

const FORMAT_OPTIONS: { value: ImageFormat; label: string; ext: string; mime: string }[] = [
  { value: 'jpeg', label: 'JPG', ext: 'jpg', mime: 'image/jpeg' },
  { value: 'png', label: 'PNG', ext: 'png', mime: 'image/png' },
  { value: 'webp', label: 'WebP', ext: 'webp', mime: 'image/webp' },
];

export default function PdfToJpgPage() {
  const t = useTranslations('tools.pdfToJpg');

  const [pages, setPages] = useState<PageImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(95);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);
    setPages([]);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Check if PDF is encrypted
      const isEncrypted = await checkPDFEncryption(arrayBuffer);
      if (isEncrypted) {
        setError(`The file "${file.name}" is password protected. Use our Unlock PDF tool to remove the password first, then try again.`);
        setIsLoading(false);
        return;
      }

      const clonedData = arrayBuffer.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: clonedData }).promise;
      const numPages = pdf.numPages;

      const pageImages: PageImage[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2; // Higher scale for better quality
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d')!;
        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const format = FORMAT_OPTIONS.find(f => f.value === outputFormat)!;
        const dataUrl = canvas.toDataURL(format.mime, quality / 100);
        pageImages.push({
          pageNumber: i,
          dataUrl,
        });
      }

      setPages(pageImages);
    } catch (err) {
      if (err instanceof EncryptedPDFError) {
        setError(err.message);
      } else {
        console.error('Failed to process PDF:', err);
        setError('Failed to process PDF file.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [outputFormat, quality]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const downloadImage = useCallback((page: PageImage) => {
    const format = FORMAT_OPTIONS.find(f => f.value === outputFormat)!;
    const link = document.createElement('a');
    link.href = page.dataUrl;
    link.download = `${fileName.replace('.pdf', '')}-page-${page.pageNumber}.${format.ext}`;
    link.click();
  }, [fileName, outputFormat]);

  const downloadAllImages = useCallback(() => {
    pages.forEach((page, index) => {
      setTimeout(() => {
        downloadImage(page);
      }, index * 200);
    });
  }, [pages, downloadImage]);

  const clearAll = useCallback(() => {
    setPages([]);
    setFileName('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
            <Link href="/#tools" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All Tools
            </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
              {/* PDF Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">
                    Drop PDF file here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or click to browse
                  </p>
                </div>
              </div>

              {isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Converting pages...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Format & Quality Options */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Output Format
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as ImageFormat)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                  >
                    {FORMAT_OPTIONS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
                {outputFormat !== 'png' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quality: {quality}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Smaller</span>
                      <span>Better</span>
                    </div>
                  </div>
                )}
              </div>

              {pages.length > 0 && !isLoading && (
                <>
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    <strong>{fileName}</strong> - {pages.length} page(s)
                  </div>
                  <button
                    onClick={downloadAllImages}
                    className="btn btn-primary w-full"
                  >
                    Download All as {FORMAT_OPTIONS.find(f => f.value === outputFormat)?.label}
                  </button>
                  <button
                    onClick={clearAll}
                    className="btn btn-ghost w-full text-sm text-red-600 dark:text-red-400"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Image Grid */}
          <div className="lg:col-span-2">
            {pages.length > 0 ? (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {pages.length} page(s) converted
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click image to download
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pages.map((page) => (
                    <button
                      key={page.pageNumber}
                      onClick={() => downloadImage(page)}
                      className="relative group aspect-[3/4] bg-white dark:bg-slate-700 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="inline-block px-2 py-1 bg-black/60 rounded text-xs text-white">
                          Page {page.pageNumber}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : !isLoading ? (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PDF uploaded yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF file to convert pages to JPG, PNG, or WebP images
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <ToolSEOSection toolId="pdf-to-jpg" />
      </div>
    </PageLayout>
  );
}
