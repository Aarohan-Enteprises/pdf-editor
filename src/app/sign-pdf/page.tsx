'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { downloadPDF, getPDFPageCount } from '@/lib/pdf-operations';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeDirection = 'se' | 'e' | 's' | 'n' | 'w' | 'ne' | 'nw' | 'sw' | null;

export default function SignPdfPage() {
  const t = useTranslations('tools.signPdf');

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDraggingSign, setIsDraggingSign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagePreview, setPagePreview] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Multi-page signature positions: Map<pageNumber, SignaturePosition>
  const [pageSignatures, setPageSignatures] = useState<Map<number, SignaturePosition>>(new Map());

  // Current signature position (for the active page)
  const [signaturePos, setSignaturePos] = useState<SignaturePosition>({
    x: 50,
    y: 50,
    width: 150,
    height: 60,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [lockAspectRatio, setLockAspectRatio] = useState(false); // Default OFF for free stretching
  const [aspectRatio, setAspectRatio] = useState(150 / 60);

  // Scale factor for display vs actual PDF coordinates
  const [scaleFactor, setScaleFactor] = useState(1);

  // Check if current page has a signature
  const currentPageHasSignature = pageSignatures.has(currentPage);

  const renderPagePreview = useCallback(async (file: File, pageNum: number) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNum);

      const viewport = page.getViewport({ scale: 1 });

      // Calculate scale to fit in container (max 600px width)
      const maxWidth = 600;
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
    setPdfFile(selectedFile);
    setOutputFilename(selectedFile.name.replace('.pdf', '-signed'));
    setError(null);
    setPageSignatures(new Map()); // Reset signatures when new PDF is loaded

    const arrayBuffer = await selectedFile.arrayBuffer();
    const count = await getPDFPageCount(arrayBuffer);
    setPageCount(count);
    setCurrentPage(1);

    renderPagePreview(selectedFile, 1);
  }, [renderPagePreview]);

  const handleSignatureFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG or JPG)');
      return;
    }
    setSignatureFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setSignaturePreview(url);
    setError(null);

    // Get image dimensions to set initial size
    const img = new Image();
    img.onload = () => {
      const maxWidth = 200;
      const ratio = img.width / img.height;
      const width = Math.min(img.width, maxWidth);
      const height = width / ratio;
      setAspectRatio(ratio);
      setSignaturePos(prev => ({ ...prev, width, height }));
    };
    img.src = url;
  }, []);

  // When changing pages, load the saved signature position or use default
  useEffect(() => {
    if (pdfFile && currentPage) {
      renderPagePreview(pdfFile, currentPage);

      // Load saved signature position for this page
      const savedPos = pageSignatures.get(currentPage);
      if (savedPos) {
        setSignaturePos(savedPos);
      }
    }
  }, [pdfFile, currentPage, renderPagePreview, pageSignatures]);

  const handlePdfDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingPdf(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handlePdfFile(droppedFile);
    },
    [handlePdfFile]
  );

  const handleSignDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingSign(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleSignatureFile(droppedFile);
    },
    [handleSignatureFile]
  );

  // Add/update signature for current page
  const addSignatureToPage = useCallback(() => {
    setPageSignatures(prev => {
      const newMap = new Map(prev);
      newMap.set(currentPage, { ...signaturePos });
      return newMap;
    });
  }, [currentPage, signaturePos]);

  // Remove signature from current page
  const removeSignatureFromPage = useCallback(() => {
    setPageSignatures(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentPage);
      return newMap;
    });
  }, [currentPage]);

  // Mouse handlers for dragging signature
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'drag' | ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();

    if (type === 'drag') {
      setIsDragging(true);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else {
      setResizeDirection(type);
      setInitialSize({
        width: signaturePos.width,
        height: signaturePos.height,
        x: signaturePos.x,
        y: signaturePos.y,
      });
      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  }, [signaturePos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasContainerRef.current) return;

    const containerRect = canvasContainerRef.current.getBoundingClientRect();

    if (isDragging) {
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      setSignaturePos(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, containerRect.width - prev.width)),
        y: Math.max(0, Math.min(newY, containerRect.height - prev.height)),
      }));
    } else if (resizeDirection) {
      const deltaX = e.clientX - dragOffset.x;
      const deltaY = e.clientY - dragOffset.y;

      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      let newX = initialSize.x;
      let newY = initialSize.y;

      // Handle different resize directions
      switch (resizeDirection) {
        case 'e': // Right edge - horizontal stretch
          newWidth = Math.max(50, Math.min(initialSize.width + deltaX, 500));
          break;
        case 'w': // Left edge - horizontal stretch
          newWidth = Math.max(50, Math.min(initialSize.width - deltaX, 500));
          newX = initialSize.x + (initialSize.width - newWidth);
          break;
        case 's': // Bottom edge - vertical stretch
          newHeight = Math.max(30, Math.min(initialSize.height + deltaY, 400));
          break;
        case 'n': // Top edge - vertical stretch
          newHeight = Math.max(30, Math.min(initialSize.height - deltaY, 400));
          newY = initialSize.y + (initialSize.height - newHeight);
          break;
        case 'se': // Bottom-right corner
          if (lockAspectRatio) {
            const avgDelta = (deltaX + deltaY) / 2;
            newWidth = Math.max(50, Math.min(initialSize.width + avgDelta, 500));
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = Math.max(50, Math.min(initialSize.width + deltaX, 500));
            newHeight = Math.max(30, Math.min(initialSize.height + deltaY, 400));
          }
          break;
        case 'sw': // Bottom-left corner
          if (lockAspectRatio) {
            const avgDelta = (-deltaX + deltaY) / 2;
            newWidth = Math.max(50, Math.min(initialSize.width + avgDelta, 500));
            newHeight = newWidth / aspectRatio;
            newX = initialSize.x + (initialSize.width - newWidth);
          } else {
            newWidth = Math.max(50, Math.min(initialSize.width - deltaX, 500));
            newHeight = Math.max(30, Math.min(initialSize.height + deltaY, 400));
            newX = initialSize.x + (initialSize.width - newWidth);
          }
          break;
        case 'ne': // Top-right corner
          if (lockAspectRatio) {
            const avgDelta = (deltaX - deltaY) / 2;
            newWidth = Math.max(50, Math.min(initialSize.width + avgDelta, 500));
            newHeight = newWidth / aspectRatio;
            newY = initialSize.y + (initialSize.height - newHeight);
          } else {
            newWidth = Math.max(50, Math.min(initialSize.width + deltaX, 500));
            newHeight = Math.max(30, Math.min(initialSize.height - deltaY, 400));
            newY = initialSize.y + (initialSize.height - newHeight);
          }
          break;
        case 'nw': // Top-left corner
          if (lockAspectRatio) {
            const avgDelta = (-deltaX - deltaY) / 2;
            newWidth = Math.max(50, Math.min(initialSize.width + avgDelta, 500));
            newHeight = newWidth / aspectRatio;
            newX = initialSize.x + (initialSize.width - newWidth);
            newY = initialSize.y + (initialSize.height - newHeight);
          } else {
            newWidth = Math.max(50, Math.min(initialSize.width - deltaX, 500));
            newHeight = Math.max(30, Math.min(initialSize.height - deltaY, 400));
            newX = initialSize.x + (initialSize.width - newWidth);
            newY = initialSize.y + (initialSize.height - newHeight);
          }
          break;
      }

      // Ensure position stays within bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - newWidth));
      newY = Math.max(0, Math.min(newY, containerRect.height - newHeight));

      setSignaturePos({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [isDragging, resizeDirection, dragOffset, initialSize, lockAspectRatio, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizeDirection(null);
  }, []);

  // Apply signatures to all marked pages
  const handleAddSignatures = useCallback(async () => {
    if (!pdfFile || !signatureFile || pageSignatures.size === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const pdfBuffer = await pdfFile.arrayBuffer();
      const signBuffer = await signatureFile.arrayBuffer();

      // Load PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

      // Embed the signature image
      let signImage;
      if (signatureFile.type === 'image/png') {
        signImage = await pdfDoc.embedPng(signBuffer);
      } else {
        signImage = await pdfDoc.embedJpg(signBuffer);
      }

      // Add signature to each page that has one
      for (const [pageNum, pos] of pageSignatures.entries()) {
        const page = pdfDoc.getPage(pageNum - 1); // 0-indexed
        const { height: pageHeight } = page.getSize();

        // Convert screen coordinates to PDF coordinates
        const pdfX = pos.x / scaleFactor;
        const pdfY = pageHeight - (pos.y / scaleFactor) - (pos.height / scaleFactor);
        const pdfWidth = pos.width / scaleFactor;
        const pdfHeight = pos.height / scaleFactor;

        page.drawImage(signImage, {
          x: pdfX,
          y: pdfY,
          width: pdfWidth,
          height: pdfHeight,
        });
      }

      const resultData = await pdfDoc.save();
      const filename = outputFilename.trim() || `signed-${pdfFile.name.replace('.pdf', '')}`;
      downloadPDF(resultData, `${filename}.pdf`);

      // Reset
      setPdfFile(null);
      setSignatureFile(null);
      setSignaturePreview(null);
      setPagePreview(null);
      setPageSignatures(new Map());
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      if (signInputRef.current) signInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to add signatures:', err);
      setError('Failed to add signatures. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [pdfFile, signatureFile, pageSignatures, scaleFactor, outputFilename]);

  const clearAll = useCallback(() => {
    setPdfFile(null);
    setSignatureFile(null);
    setSignaturePreview(null);
    setPagePreview(null);
    setPageSignatures(new Map());
    setError(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (signInputRef.current) signInputRef.current.value = '';
  }, []);

  // Get list of pages with signatures
  const pagesWithSignatures = Array.from(pageSignatures.keys()).sort((a, b) => a - b);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
          {/* Left: Upload Controls */}
          <div className="lg:col-span-1">
            <div className="card p-4 space-y-4 sticky top-24">
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

              {/* Signature Dropzone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2. Select Signature Image
                </label>
                <div
                  onClick={() => signInputRef.current?.click()}
                  onDrop={handleSignDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingSign(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingSign(false); }}
                  className={`dropzone py-4 ${isDraggingSign ? 'dropzone-active' : ''}`}
                >
                  <input
                    ref={signInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => e.target.files?.[0] && handleSignatureFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    {signaturePreview ? (
                      <img src={signaturePreview} alt="Signature" className="max-h-12 max-w-full" />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Drop image or click to browse</p>
                    )}
                  </div>
                </div>
              </div>

              {pdfFile && signatureFile && (
                <>
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

                  {/* Add/Remove signature for current page */}
                  <div className="flex gap-2">
                    <button
                      onClick={addSignatureToPage}
                      className={`flex-1 btn text-sm ${currentPageHasSignature ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {currentPageHasSignature ? 'Update Page ' + currentPage : 'Add to Page ' + currentPage}
                    </button>
                    {currentPageHasSignature && (
                      <button
                        onClick={removeSignatureFromPage}
                        className="btn btn-ghost text-sm text-red-600 dark:text-red-400 px-3"
                        title="Remove signature from this page"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Pages with signatures */}
                  {pagesWithSignatures.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                      <p className="text-xs text-green-800 dark:text-green-200 mb-2 font-medium">
                        Signatures on {pagesWithSignatures.length} page(s):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {pagesWithSignatures.map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 py-1 text-xs rounded ${
                              pageNum === currentPage
                                ? 'bg-green-600 text-white'
                                : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700'
                            }`}
                          >
                            Page {pageNum}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signature Size Controls */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Signature Size
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
                          <input
                            type="number"
                            min={50}
                            max={500}
                            value={Math.round(signaturePos.width)}
                            onChange={(e) => {
                              const newWidth = Math.max(50, Math.min(500, parseInt(e.target.value) || 50));
                              if (lockAspectRatio) {
                                setSignaturePos(prev => ({
                                  ...prev,
                                  width: newWidth,
                                  height: newWidth / aspectRatio,
                                }));
                              } else {
                                setSignaturePos(prev => ({ ...prev, width: newWidth }));
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Height</label>
                          <input
                            type="number"
                            min={30}
                            max={400}
                            value={Math.round(signaturePos.height)}
                            onChange={(e) => {
                              const newHeight = Math.max(30, Math.min(400, parseInt(e.target.value) || 30));
                              if (lockAspectRatio) {
                                setSignaturePos(prev => ({
                                  ...prev,
                                  height: newHeight,
                                  width: newHeight * aspectRatio,
                                }));
                              } else {
                                setSignaturePos(prev => ({ ...prev, height: newHeight }));
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lockAspectRatio}
                          onChange={(e) => setLockAspectRatio(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Lock aspect ratio</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Drag</strong> to move. <strong>Edge handles</strong> to stretch. <strong>Corner handles</strong> to resize.
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
                        placeholder="signed-document"
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

                  <button onClick={clearAll} className="btn btn-ghost w-full text-sm text-red-600">
                    Clear All
                  </button>
                  <button
                    onClick={handleAddSignatures}
                    disabled={isProcessing || pageSignatures.size === 0}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? 'Processing...' : `Sign ${pageSignatures.size} Page(s) & Download`}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Interactive Canvas */}
          <div className="lg:col-span-2">
            {pagePreview && signaturePreview ? (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Position signature on page {currentPage}
                  </h3>
                  {currentPageHasSignature && (
                    <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      Signature added
                    </span>
                  )}
                </div>
                <div
                  ref={canvasContainerRef}
                  className="relative inline-block border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden cursor-crosshair select-none"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={pagePreview}
                    alt="PDF Page"
                    className="block"
                    draggable={false}
                  />
                  {/* Signature overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      left: signaturePos.x,
                      top: signaturePos.y,
                      width: signaturePos.width,
                      height: signaturePos.height,
                    }}
                    className={`border-2 ${currentPageHasSignature ? 'border-green-500' : 'border-rose-500'} bg-white/80 cursor-move`}
                    onMouseDown={(e) => handleMouseDown(e, 'drag')}
                  >
                    <img
                      src={signaturePreview}
                      alt="Signature"
                      className="w-full h-full object-fill pointer-events-none"
                      draggable={false}
                    />

                    {/* Corner resize handles */}
                    <div
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-rose-500 rounded-sm cursor-nw-resize hover:bg-rose-600"
                      onMouseDown={(e) => handleMouseDown(e, 'nw')}
                    />
                    <div
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-rose-500 rounded-sm cursor-ne-resize hover:bg-rose-600"
                      onMouseDown={(e) => handleMouseDown(e, 'ne')}
                    />
                    <div
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-rose-500 rounded-sm cursor-sw-resize hover:bg-rose-600"
                      onMouseDown={(e) => handleMouseDown(e, 'sw')}
                    />
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-rose-500 rounded-sm cursor-se-resize hover:bg-rose-600"
                      onMouseDown={(e) => handleMouseDown(e, 'se')}
                    />

                    {/* Edge resize handles for stretching */}
                    <div
                      className="absolute top-1/2 -left-1.5 w-2 h-6 -translate-y-1/2 bg-blue-500 rounded-sm cursor-w-resize hover:bg-blue-600"
                      onMouseDown={(e) => handleMouseDown(e, 'w')}
                    />
                    <div
                      className="absolute top-1/2 -right-1.5 w-2 h-6 -translate-y-1/2 bg-blue-500 rounded-sm cursor-e-resize hover:bg-blue-600"
                      onMouseDown={(e) => handleMouseDown(e, 'e')}
                    />
                    <div
                      className="absolute -top-1.5 left-1/2 w-6 h-2 -translate-x-1/2 bg-blue-500 rounded-sm cursor-n-resize hover:bg-blue-600"
                      onMouseDown={(e) => handleMouseDown(e, 'n')}
                    />
                    <div
                      className="absolute -bottom-1.5 left-1/2 w-6 h-2 -translate-x-1/2 bg-blue-500 rounded-sm cursor-s-resize hover:bg-blue-600"
                      onMouseDown={(e) => handleMouseDown(e, 's')}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Sign Your PDF
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF and signature image to get started. You can sign multiple pages at different locations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
