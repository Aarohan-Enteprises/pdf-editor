'use client';

import { useState, useCallback } from 'react';
import { downloadPDF } from '@/lib/pdf-operations';

interface UsePDFPreviewReturn {
  isPreviewOpen: boolean;
  previewData: Uint8Array | null;
  previewFilename: string;
  showPreview: (data: Uint8Array, filename: string) => void;
  closePreview: () => void;
  downloadPreview: () => void;
}

export function usePDFPreview(): UsePDFPreviewReturn {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Uint8Array | null>(null);
  const [previewFilename, setPreviewFilename] = useState('');

  const showPreview = useCallback((data: Uint8Array, filename: string) => {
    setPreviewData(data);
    setPreviewFilename(filename);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    // Delay clearing data to allow for closing animation
    setTimeout(() => {
      setPreviewData(null);
      setPreviewFilename('');
    }, 300);
  }, []);

  const downloadPreview = useCallback(() => {
    if (previewData && previewFilename) {
      downloadPDF(previewData, previewFilename);
      closePreview();
    }
  }, [previewData, previewFilename, closePreview]);

  return {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  };
}
