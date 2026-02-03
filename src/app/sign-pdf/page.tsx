'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { getPDFPageCount, checkPDFEncryption, EncryptedPDFError } from '@/lib/pdf-operations';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  // Load Google Fonts for signatures
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Great+Vibes&family=Homemade+Apple&family=Indie+Flower&family=Kalam&family=Pacifico&family=Permanent+Marker&family=Satisfy&display=swap';
  link.rel = 'stylesheet';
  if (!document.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link);
  }
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

  // Signature mode: 'upload' or 'text'
  const [signatureMode, setSignatureMode] = useState<'upload' | 'text'>('upload');

  // Text signature options
  const [signatureText, setSignatureText] = useState('');
  const [signatureFont, setSignatureFont] = useState('Dancing Script');
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [signatureFontSize, setSignatureFontSize] = useState(48);
  const [signatureBold, setSignatureBold] = useState(false);
  const [signatureItalic, setSignatureItalic] = useState(true);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Available handwriting-style fonts
  const signatureFonts = [
    { name: 'Dancing Script', label: 'Dancing Script' },
    { name: 'Great Vibes', label: 'Great Vibes' },
    { name: 'Pacifico', label: 'Pacifico' },
    { name: 'Satisfy', label: 'Satisfy' },
    { name: 'Caveat', label: 'Caveat' },
    { name: 'Kalam', label: 'Kalam' },
    { name: 'Indie Flower', label: 'Indie Flower' },
    { name: 'Permanent Marker', label: 'Permanent Marker' },
    { name: 'Homemade Apple', label: 'Homemade Apple' },
    { name: 'cursive', label: 'System Cursive' },
  ];

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

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
      setOutputFilename(selectedFile.name.replace('.pdf', '-signed'));
      setError(null);
      setPageSignatures(new Map()); // Reset signatures when new PDF is loaded

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

  // Generate text signature as image
  const generateTextSignature = useCallback(() => {
    if (!signatureText.trim()) {
      setSignaturePreview(null);
      setSignatureFile(null);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Set font for measuring
    const fontWeight = signatureBold ? 'bold' : 'normal';
    const fontStyle = signatureItalic ? 'italic' : 'normal';
    const font = `${fontStyle} ${fontWeight} ${signatureFontSize}px "${signatureFont}", cursive`;
    ctx.font = font;

    // Measure text
    const metrics = ctx.measureText(signatureText);
    const textWidth = metrics.width;
    const textHeight = signatureFontSize * 1.2;

    // Set canvas size with padding
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Clear and set background transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.font = font;
    ctx.fillStyle = signatureColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(signatureText, padding, canvas.height / 2);

    // Convert to data URL and create blob for signatureFile
    const dataUrl = canvas.toDataURL('image/png');
    setSignaturePreview(dataUrl);

    // Convert to blob for PDF embedding
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'text-signature.png', { type: 'image/png' });
        setSignatureFile(file);

        // Update signature size
        const maxWidth = 200;
        const ratio = canvas.width / canvas.height;
        const width = Math.min(canvas.width, maxWidth);
        const height = width / ratio;
        setAspectRatio(ratio);
        setSignaturePos(prev => ({ ...prev, width, height }));
      }
    }, 'image/png');
  }, [signatureText, signatureFont, signatureColor, signatureFontSize, signatureBold, signatureItalic]);

  // Regenerate text signature when options change
  useEffect(() => {
    if (signatureMode === 'text') {
      generateTextSignature();
    }
  }, [signatureMode, signatureText, signatureFont, signatureColor, signatureFontSize, signatureBold, signatureItalic, generateTextSignature]);

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

  // Re-render preview on window resize (for orientation change on mobile)
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

  // Get client coordinates from mouse or touch event
  const getClientCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }, []);

  // Mouse/Touch handlers for dragging signature
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, type: 'drag' | ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = getClientCoords(e);

    if (type === 'drag') {
      setIsDragging(true);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    } else {
      setResizeDirection(type);
      setInitialSize({
        width: signaturePos.width,
        height: signaturePos.height,
        x: signaturePos.x,
        y: signaturePos.y,
      });
      setDragOffset({ x: clientX, y: clientY });
    }
  }, [signaturePos, getClientCoords]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasContainerRef.current) return;
    if (!isDragging && !resizeDirection) return;

    e.preventDefault(); // Prevent scrolling on touch devices

    const { clientX, clientY } = getClientCoords(e);
    const containerRect = canvasContainerRef.current.getBoundingClientRect();

    if (isDragging) {
      const newX = clientX - containerRect.left - dragOffset.x;
      const newY = clientY - containerRect.top - dragOffset.y;

      setSignaturePos(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, containerRect.width - prev.width)),
        y: Math.max(0, Math.min(newY, containerRect.height - prev.height)),
      }));
    } else if (resizeDirection) {
      const deltaX = clientX - dragOffset.x;
      const deltaY = clientY - dragOffset.y;

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
  }, [isDragging, resizeDirection, dragOffset, initialSize, lockAspectRatio, aspectRatio, getClientCoords]);

  const handlePointerUp = useCallback(() => {
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
      showPreview(resultData, `${filename}.pdf`);
    } catch (err) {
      console.error('Failed to add signatures:', err);
      setError('Failed to add signatures. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [pdfFile, signatureFile, pageSignatures, scaleFactor, outputFilename, showPreview]);

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
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

              {/* Signature Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2. Create Signature
                </label>
                <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden mb-3">
                  <button
                    onClick={() => setSignatureMode('text')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      signatureMode === 'text'
                        ? 'bg-rose-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Type Text
                  </button>
                  <button
                    onClick={() => setSignatureMode('upload')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      signatureMode === 'upload'
                        ? 'bg-rose-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Upload Image
                  </button>
                </div>

                {signatureMode === 'upload' ? (
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
                      {signaturePreview && signatureMode === 'upload' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signaturePreview} alt="Signature" className="max-h-12 max-w-full" />
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Drop image or click to browse</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Text input */}
                    <input
                      type="text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Type your signature..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      style={{ fontFamily: `"${signatureFont}", cursive` }}
                    />

                    {/* Font selection */}
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Font</label>
                      <select
                        value={signatureFont}
                        onChange={(e) => setSignatureFont(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                      >
                        {signatureFonts.map((font) => (
                          <option key={font.name} value={font.name} style={{ fontFamily: `"${font.name}", cursive` }}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Color and Size */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
                        <input
                          type="color"
                          value={signatureColor}
                          onChange={(e) => setSignatureColor(e.target.value)}
                          className="w-full h-9 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Size</label>
                        <input
                          type="number"
                          min={24}
                          max={96}
                          value={signatureFontSize}
                          onChange={(e) => setSignatureFontSize(Math.max(24, Math.min(96, parseInt(e.target.value) || 48)))}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Style toggles */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSignatureBold(!signatureBold)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors ${
                          signatureBold
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        B
                      </button>
                      <button
                        onClick={() => setSignatureItalic(!signatureItalic)}
                        className={`px-3 py-1.5 rounded-lg border text-sm italic transition-colors ${
                          signatureItalic
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        I
                      </button>
                    </div>

                    {/* Preview */}
                    {signaturePreview && (
                      <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={signaturePreview} alt="Signature Preview" className="max-h-16 max-w-full" />
                      </div>
                    )}
                  </div>
                )}
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

                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                    <p className="text-xs text-indigo-800 dark:text-indigo-200">
                      <strong>Drag</strong> to move. <strong>Corner circles</strong> to resize proportionally. <strong>Edge handles</strong> to stretch.
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
                    {isProcessing ? 'Processing...' : `Sign ${pageSignatures.size} Page(s) & Preview`}
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
                    {signaturePreview ? `Position signature on page ${currentPage}` : `Page ${currentPage} of ${pageCount}`}
                  </h3>
                  {currentPageHasSignature && (
                    <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      Signature added
                    </span>
                  )}
                </div>
                <div
                  ref={canvasContainerRef}
                  className={`relative inline-block border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden select-none max-w-full ${signaturePreview ? 'cursor-crosshair' : ''}`}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  onTouchCancel={handlePointerUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pagePreview}
                    alt="PDF Page"
                    className="block max-w-full h-auto"
                    draggable={false}
                  />
                  {/* Signature overlay - only show when signature is uploaded */}
                  {signaturePreview && (
                    <div
                      style={{
                        position: 'absolute',
                        left: signaturePos.x,
                        top: signaturePos.y,
                        width: signaturePos.width,
                        height: signaturePos.height,
                      }}
                      className={`border-2 border-dashed ${currentPageHasSignature ? 'border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]' : 'border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'} cursor-move touch-none rounded-sm transition-shadow`}
                      onMouseDown={(e) => handlePointerDown(e, 'drag')}
                      onTouchStart={(e) => handlePointerDown(e, 'drag')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signaturePreview}
                        alt="Signature"
                        className="w-full h-full object-fill pointer-events-none"
                        draggable={false}
                      />

                      {/* Corner resize handles - professional white circles with border */}
                      <div
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 md:w-2.5 md:h-2.5 bg-white border-2 border-indigo-500 rounded-full cursor-nw-resize hover:scale-125 hover:border-indigo-600 active:bg-indigo-100 shadow-sm transition-transform touch-none"
                        onMouseDown={(e) => handlePointerDown(e, 'nw')}
                        onTouchStart={(e) => handlePointerDown(e, 'nw')}
                      />
                      <div
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 md:w-2.5 md:h-2.5 bg-white border-2 border-indigo-500 rounded-full cursor-ne-resize hover:scale-125 hover:border-indigo-600 active:bg-indigo-100 shadow-sm transition-transform touch-none"
                        onMouseDown={(e) => handlePointerDown(e, 'ne')}
                        onTouchStart={(e) => handlePointerDown(e, 'ne')}
                      />
                      <div
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 md:w-2.5 md:h-2.5 bg-white border-2 border-indigo-500 rounded-full cursor-sw-resize hover:scale-125 hover:border-indigo-600 active:bg-indigo-100 shadow-sm transition-transform touch-none"
                        onMouseDown={(e) => handlePointerDown(e, 'sw')}
                        onTouchStart={(e) => handlePointerDown(e, 'sw')}
                      />
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 md:w-2.5 md:h-2.5 bg-white border-2 border-indigo-500 rounded-full cursor-se-resize hover:scale-125 hover:border-indigo-600 active:bg-indigo-100 shadow-sm transition-transform touch-none"
                        onMouseDown={(e) => handlePointerDown(e, 'se')}
                        onTouchStart={(e) => handlePointerDown(e, 'se')}
                      />

                      {/* Edge resize handles - subtle white rectangles with border */}
                      <div
                        className="absolute top-1/2 -left-1 w-2 h-5 md:w-1.5 md:h-4 -translate-y-1/2 bg-white border border-indigo-400 rounded-sm cursor-w-resize hover:scale-110 hover:border-indigo-600 active:bg-indigo-100 shadow-sm transition-transform touch-none"
                        onMouseDown={(e) => handlePointerDown(e, 'w')}
                        onTouchStart={(e) => handlePointerDown(e, 'w')}
                      />
                      <div
                        className="absolute top-1/2 -right-1 w-2 h-5 md:w-1.5 md:h-4 -translate-y-1/2 bg-white border border-indigo-400 rounded-sm cursor-e-resize hover:scale-110 hover:border-indigo-600 active:bg-indigo-100 shadow-sm transition-transform touch-none"
                        onMouseDown={(e) => handlePointerDown(e, 'e')}
                        onTouchStart={(e) => handlePointerDown(e, 'e')}
                      />
                      <div
                        className="absolute -top-1 left-1/2 w-5 h-2 md:w-4 md:h-1.5 -translate-x-1/2 bg-white border border-indigo-400 rounded-sm cursor-n-resize hover:scale-110 hover:border-indigo-600 active:bg-indigo-100 shadow-sm transition-transform touch-none"
                        onMouseDown={(e) => handlePointerDown(e, 'n')}
                        onTouchStart={(e) => handlePointerDown(e, 'n')}
                      />
                      <div
                        className="absolute -bottom-1 left-1/2 w-5 h-2 md:w-4 md:h-1.5 -translate-x-1/2 bg-white border border-indigo-400 rounded-sm cursor-s-resize hover:scale-110 hover:border-indigo-600 active:bg-indigo-100 shadow-sm transition-transform touch-none"
                        onMouseDown={(e) => handlePointerDown(e, 's')}
                        onTouchStart={(e) => handlePointerDown(e, 's')}
                      />
                    </div>
                  )}
                </div>
                {/* Prompt to add signature if PDF is loaded but no signature yet */}
                {!signaturePreview && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Now create or upload a signature to position it on this page.
                    </p>
                  </div>
                )}
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
                  Upload a PDF to get started. You can sign multiple pages at different locations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
