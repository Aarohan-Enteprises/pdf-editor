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
  onRotate: (degrees: number) => void;
  onDelete: () => void;
  onThumbnailLoad: (thumbnail: string) => void;
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
    <div className="thumbnail-card ring-2 ring-blue-500 shadow-2xl scale-105 cursor-grabbing">
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
  onRotate,
  onDelete,
  onThumbnailLoad,
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
        ${isSelected ? 'selected ring-2 ring-blue-500' : ''}
        ${isDragging ? 'opacity-40 ring-2 ring-dashed ring-blue-400' : ''}
        cursor-grab active:cursor-grabbing
        hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-600
        transition-shadow
      `}
      {...attributes}
      {...listeners}
    >
      {/* Drag indicator - always visible */}
      <div className="absolute top-1 left-1 z-10 p-1 rounded bg-black/50 text-white">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm2 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </div>

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

      {/* Action buttons - stop propagation to prevent drag */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSelect();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded bg-white/90 dark:bg-slate-800/90 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          title="Select"
        >
          <svg className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRotate(-90);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded bg-white/90 dark:bg-slate-800/90 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Rotate Left"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRotate(90);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded bg-white/90 dark:bg-slate-800/90 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Rotate Right"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded bg-red-500/90 hover:bg-red-600 text-white transition-colors"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isSelected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-blue-500/80 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
