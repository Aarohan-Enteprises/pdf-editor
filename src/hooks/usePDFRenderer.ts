'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { renderPageToCanvas, initPDFWorker } from '@/lib/pdf-renderer';

interface UsePDFRendererOptions {
  maxWidth?: number;
  maxHeight?: number;
}

export function usePDFRenderer(
  pdfData: ArrayBuffer | null,
  pageNumber: number,
  rotation: number = 0,
  options: UsePDFRendererOptions = {}
) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const renderIdRef = useRef(0);

  const render = useCallback(async () => {
    if (!pdfData) {
      setThumbnail(null);
      return;
    }

    const currentRenderId = ++renderIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      initPDFWorker();

      const dataUrl = await renderPageToCanvas(pdfData, pageNumber, {
        maxWidth: options.maxWidth || 200,
        maxHeight: options.maxHeight || 280,
      });

      if (currentRenderId === renderIdRef.current) {
        setThumbnail(dataUrl);
      }
    } catch (err) {
      if (currentRenderId === renderIdRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to render page'));
      }
    } finally {
      if (currentRenderId === renderIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [pdfData, pageNumber, options.maxWidth, options.maxHeight]);

  useEffect(() => {
    render();
  }, [render, rotation]);

  return { thumbnail, isLoading, error, refresh: render };
}

export function useBatchPDFRenderer() {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const renderQueueRef = useRef<Array<{
    id: string;
    pdfData: ArrayBuffer;
    pageNumber: number;
  }>>([]);
  const isRenderingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (isRenderingRef.current || renderQueueRef.current.length === 0) {
      return;
    }

    isRenderingRef.current = true;
    setIsLoading(true);

    try {
      initPDFWorker();

      while (renderQueueRef.current.length > 0) {
        const item = renderQueueRef.current.shift();
        if (!item) continue;

        try {
          const dataUrl = await renderPageToCanvas(item.pdfData, item.pageNumber, {
            maxWidth: 200,
            maxHeight: 280,
          });

          setThumbnails((prev) => {
            const newMap = new Map(prev);
            newMap.set(item.id, dataUrl);
            return newMap;
          });
        } catch (error) {
          console.error(`Failed to render page ${item.id}:`, error);
        }
      }
    } finally {
      isRenderingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const queueRender = useCallback(
    (id: string, pdfData: ArrayBuffer, pageNumber: number) => {
      const existingIndex = renderQueueRef.current.findIndex((item) => item.id === id);
      if (existingIndex !== -1) {
        renderQueueRef.current.splice(existingIndex, 1);
      }

      renderQueueRef.current.push({ id, pdfData, pageNumber });
      processQueue();
    },
    [processQueue]
  );

  const getThumbnail = useCallback(
    (id: string): string | undefined => {
      return thumbnails.get(id);
    },
    [thumbnails]
  );

  const clearThumbnails = useCallback(() => {
    setThumbnails(new Map());
    renderQueueRef.current = [];
  }, []);

  return { thumbnails, isLoading, queueRender, getThumbnail, clearThumbnails };
}
