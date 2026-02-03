'use client';

import { useState, useCallback, useRef } from 'react';
import { PageInfo, checkPDFEncryption, EncryptedPDFError } from '@/lib/pdf-operations';

export const MAX_TOTAL_PAGES = 200;

export class PageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PageLimitError';
  }
}

export { EncryptedPDFError };

export interface PDFFile {
  id: string;
  name: string;
  data: ArrayBuffer;
  pageCount: number;
  isEncrypted?: boolean;
}

export interface PDFState {
  files: PDFFile[];
  pages: PageInfo[];
  selectedPages: Set<string>;
  hasEncryptedFile: boolean;
}

export function usePDFDocument() {
  const [state, setState] = useState<PDFState>({
    files: [],
    pages: [],
    selectedPages: new Set(),
    hasEncryptedFile: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const currentPageCountRef = useRef(0);

  const addFiles = useCallback(async (newFiles: File[]) => {
    setIsLoading(true);

    try {
      const pdfLib = await import('pdf-lib');

      const loadedFiles: PDFFile[] = [];
      let totalNewPages = 0;
      for (const file of newFiles) {
        const arrayBuffer = await file.arrayBuffer();

        // Check if PDF is encrypted/password-protected
        const isEncrypted = await checkPDFEncryption(arrayBuffer.slice(0));
        if (isEncrypted) {
          throw new EncryptedPDFError(
            `The file "${file.name}" is password protected or encrypted. Please remove the password protection before editing.`
          );
        }

        const pdf = await pdfLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pdf.getPageCount();
        totalNewPages += pageCount;

        // Check if adding these pages would exceed the limit
        if (currentPageCountRef.current + totalNewPages > MAX_TOTAL_PAGES) {
          throw new PageLimitError(
            `Cannot add files. Total pages would exceed ${MAX_TOTAL_PAGES} page limit.`
          );
        }

        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        loadedFiles.push({
          id: fileId,
          name: file.name,
          data: arrayBuffer,
          pageCount,
          isEncrypted: false,
        });
      }

      setState((prev) => {
        const updatedFiles = [...prev.files, ...loadedFiles];
        const correctedPages: PageInfo[] = [];
        const fileOffset = prev.files.length;

        for (let fileIndex = 0; fileIndex < loadedFiles.length; fileIndex++) {
          const file = loadedFiles[fileIndex];
          for (let i = 0; i < file.pageCount; i++) {
            correctedPages.push({
              id: `${file.id}-page-${i}`,
              pageIndex: i,
              sourceIndex: fileOffset + fileIndex,
              rotation: 0,
            });
          }
        }

        const newPages = [...prev.pages, ...correctedPages];
        currentPageCountRef.current = newPages.length;

        return {
          ...prev,
          files: updatedFiles,
          pages: newPages,
        };
      });
    } catch (error) {
      console.error('Error loading PDF files:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removePage = useCallback((pageId: string) => {
    setState((prev) => {
      const newPages = prev.pages.filter((p) => p.id !== pageId);
      currentPageCountRef.current = newPages.length;
      return {
        ...prev,
        pages: newPages,
        selectedPages: new Set([...prev.selectedPages].filter((id) => id !== pageId)),
      };
    });
  }, []);

  const reorderPages = useCallback((activeId: string, overId: string) => {
    setState((prev) => {
      const oldIndex = prev.pages.findIndex((p) => p.id === activeId);
      const newIndex = prev.pages.findIndex((p) => p.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const newPages = [...prev.pages];
      const [movedPage] = newPages.splice(oldIndex, 1);
      newPages.splice(newIndex, 0, movedPage);

      return {
        ...prev,
        pages: newPages,
      };
    });
  }, []);

  const rotatePage = useCallback((pageId: string, degrees: number) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === pageId ? { ...p, rotation: (p.rotation + degrees) % 360 } : p
      ),
    }));
  }, []);

  const rotateSelectedPages = useCallback((degrees: number) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        prev.selectedPages.has(p.id)
          ? { ...p, rotation: (p.rotation + degrees) % 360 }
          : p
      ),
    }));
  }, []);

  const togglePageSelection = useCallback((pageId: string) => {
    setState((prev) => {
      const newSelected = new Set(prev.selectedPages);
      if (newSelected.has(pageId)) {
        newSelected.delete(pageId);
      } else {
        newSelected.add(pageId);
      }
      return { ...prev, selectedPages: newSelected };
    });
  }, []);

  const selectAllPages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedPages: new Set(prev.pages.map((p) => p.id)),
    }));
  }, []);

  const deselectAllPages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedPages: new Set(),
    }));
  }, []);

  const updatePageThumbnail = useCallback((pageId: string, thumbnail: string) => {
    setState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === pageId ? { ...p, thumbnail } : p
      ),
    }));
  }, []);

  const clearAll = useCallback(() => {
    currentPageCountRef.current = 0;
    setState({
      files: [],
      pages: [],
      selectedPages: new Set(),
      hasEncryptedFile: false,
    });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setState((prev) => {
      const fileIndex = prev.files.findIndex((f) => f.id === fileId);
      if (fileIndex === -1) return prev;

      const newFiles = prev.files.filter((f) => f.id !== fileId);
      const newPages = prev.pages.filter((p) => p.sourceIndex !== fileIndex);

      // Update sourceIndex for pages from files after the removed one
      const updatedPages = newPages.map((p) => ({
        ...p,
        sourceIndex: p.sourceIndex > fileIndex ? p.sourceIndex - 1 : p.sourceIndex,
      }));

      currentPageCountRef.current = updatedPages.length;

      return {
        ...prev,
        files: newFiles,
        pages: updatedPages,
        selectedPages: new Set(
          [...prev.selectedPages].filter((id) =>
            updatedPages.some((p) => p.id === id)
          )
        ),
      };
    });
  }, []);

  const reorderFiles = useCallback((activeId: string, overId: string) => {
    setState((prev) => {
      const oldIndex = prev.files.findIndex((f) => f.id === activeId);
      const newIndex = prev.files.findIndex((f) => f.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

      // Reorder files
      const newFiles = [...prev.files];
      const [movedFile] = newFiles.splice(oldIndex, 1);
      newFiles.splice(newIndex, 0, movedFile);

      // Create a mapping from old file index to new file index
      const indexMap = new Map<number, number>();
      prev.files.forEach((file, idx) => {
        const newIdx = newFiles.findIndex((f) => f.id === file.id);
        indexMap.set(idx, newIdx);
      });

      // Rebuild pages array in new file order
      const pagesByFile: PageInfo[][] = newFiles.map(() => []);
      prev.pages.forEach((page) => {
        const newFileIndex = indexMap.get(page.sourceIndex);
        if (newFileIndex !== undefined) {
          pagesByFile[newFileIndex].push({
            ...page,
            sourceIndex: newFileIndex,
          });
        }
      });

      // Flatten pages, maintaining order within each file
      const newPages = pagesByFile.flat();

      return {
        ...prev,
        files: newFiles,
        pages: newPages,
      };
    });
  }, []);

  const getSelectedPageIndices = useCallback((): number[] => {
    return state.pages
      .map((page, index) => (state.selectedPages.has(page.id) ? index : -1))
      .filter((index) => index !== -1);
  }, [state.pages, state.selectedPages]);

  return {
    files: state.files,
    pages: state.pages,
    selectedPages: state.selectedPages,
    hasEncryptedFile: state.hasEncryptedFile,
    isLoading,
    addFiles,
    removePage,
    removeFile,
    reorderPages,
    reorderFiles,
    rotatePage,
    rotateSelectedPages,
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    updatePageThumbnail,
    clearAll,
    getSelectedPageIndices,
  };
}
