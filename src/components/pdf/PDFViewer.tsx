'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PageThumbnail, PageThumbnailOverlay } from './PageThumbnail';
import { PageInfo } from '@/lib/pdf-operations';
import { PDFFile } from '@/hooks/usePDFDocument';

interface PDFViewerProps {
  files: PDFFile[];
  pages: PageInfo[];
  selectedPages: Set<string>;
  onToggleSelection: (pageId: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onRotate: (pageId: string, degrees: number) => void;
  onDelete: (pageId: string) => void;
  onThumbnailLoad: (pageId: string, thumbnail: string) => void;
}

export function PDFViewer({
  files,
  pages,
  selectedPages,
  onToggleSelection,
  onReorder,
  onRotate,
  onDelete,
  onThumbnailLoad,
}: PDFViewerProps) {
  const t = useTranslations('viewer');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        onReorder(active.id as string, over.id as string);
      }
    },
    [onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const getFileForPage = useCallback(
    (page: PageInfo): PDFFile | null => {
      return files[page.sourceIndex] || null;
    },
    [files]
  );

  const activePage = activeId ? pages.find(p => p.id === activeId) : null;
  const activePageIndex = activePage ? pages.findIndex(p => p.id === activeId) : -1;

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <p>{t('noPages')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {pages.length} {t('page')}{pages.length !== 1 ? 's' : ''}
        </span>
        {selectedPages.size > 0 && (
          <span>
            {selectedPages.size} {t('selected')}
          </span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {pages.map((page, index) => {
              const file = getFileForPage(page);
              return (
                <PageThumbnail
                  key={page.id}
                  page={page}
                  pageNumber={index + 1}
                  isSelected={selectedPages.has(page.id)}
                  thumbnail={page.thumbnail}
                  pdfData={file?.data || null}
                  onSelect={() => onToggleSelection(page.id)}
                  onRotate={(degrees) => onRotate(page.id, degrees)}
                  onDelete={() => onDelete(page.id)}
                  onThumbnailLoad={(thumbnail) => onThumbnailLoad(page.id, thumbnail)}
                />
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>
          {activePage ? (
            <PageThumbnailOverlay
              page={activePage}
              pageNumber={activePageIndex + 1}
              thumbnail={activePage.thumbnail}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
