'use client';

import { useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageInfo } from '@/lib/pdf-operations';

interface PageThumbnailProps {
  page: PageInfo;
  pageNumber: number;
  isSelected: boolean;
  thumbnail?: string;
  pdfData: ArrayBuffer | null;
  onSelect: () => void;
  onThumbnailLoad: (thumbnail: string) => void;
  onDelete?: () => void;
}

// Overlay component shown while dragging
export function PageThumbnailOverlay({
  page,
  pageNumber,
  thumbnail,
}: {
  page: PageInfo;
  pageNumber: number;
  thumbnail?: string;
}) {
  return (
    <div className="thumbnail-card ring-2 ring-indigo-500 shadow-2xl scale-105 cursor-grabbing">
      <div
        className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden"
        style={{ transform: `rotate(${page.rotation}deg)` }}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={`Page ${pageNumber}`}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24">
              <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <span className="text-white text-sm font-medium">{pageNumber}</span>
      </div>
    </div>
  );
}

export function PageThumbnail({
  page,
  pageNumber,
  isSelected,
  thumbnail,
  pdfData,
  onSelect,
  onThumbnailLoad,
  onDelete,
}: PageThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (!thumbnail && pdfData) {
      const renderThumbnail = async () => {
        try {
          const { renderPageToCanvas, initPDFWorker } = await import('@/lib/pdf-renderer');
          initPDFWorker();
          const dataUrl = await renderPageToCanvas(pdfData, page.pageIndex + 1, {
            maxWidth: 200,
            maxHeight: 280,
          });
          onThumbnailLoad(dataUrl);
        } catch (error) {
          console.error('Failed to render thumbnail:', error);
        }
      };
      renderThumbnail();
    }
  }, [thumbnail, pdfData, page.pageIndex, onThumbnailLoad]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        thumbnail-card group relative
        ${isSelected ? 'selected ring-2 ring-indigo-500' : ''}
        ${isDragging ? 'opacity-40 ring-2 ring-dashed ring-indigo-400' : ''}
        cursor-pointer
        hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-500
        transition-shadow
      `}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <div
        className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden"
        style={{ transform: `rotate(${page.rotation}deg)` }}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={`Page ${pageNumber}`}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <span className="text-white text-sm font-medium">{pageNumber}</span>
      </div>

      {isSelected && (
        <>
          <div className="absolute inset-0 ring-2 ring-indigo-500 rounded-xl pointer-events-none" />
          <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center pointer-events-none">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </>
      )}

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 left-1 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
          title="Delete page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
