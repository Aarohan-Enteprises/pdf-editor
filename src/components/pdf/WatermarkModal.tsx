'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { WatermarkOptions } from '@/lib/pdf-operations';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: WatermarkOptions, applyToAll: boolean) => void;
  hasSelection: boolean;
}

type Position = 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export function WatermarkModal({
  isOpen,
  onClose,
  onApply,
  hasSelection,
}: WatermarkModalProps) {
  const t = useTranslations('watermark');
  const tCommon = useTranslations('common');

  const [text, setText] = useState('WATERMARK');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#808080');
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState<Position>('center');
  const [applyToAll, setApplyToAll] = useState(!hasSelection);

  const handleApply = () => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
          }
        : { r: 0.5, g: 0.5, b: 0.5 };
    };

    onApply(
      {
        text,
        fontSize,
        color: hexToRgb(color),
        opacity,
        position,
      },
      applyToAll
    );
    onClose();
  };

  const positions: Position[] = ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon('cancel')}
          </Button>
          <Button variant="primary" onClick={handleApply} disabled={!text.trim()}>
            {tCommon('apply')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('text')}
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('textPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('fontSize')}
            </label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min={8}
              max={200}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('color')}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded cursor-pointer border border-gray-300 dark:border-slate-600"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('opacity')}: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            min={0}
            max={1}
            step={0.05}
            className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('position')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setPosition(pos)}
                className={`
                  px-3 py-2 text-sm rounded-lg border transition-all
                  ${
                    position === pos
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                {t(`positions.${pos}`)}
              </button>
            ))}
          </div>
        </div>

        {hasSelection && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('applyTo')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!applyToAll}
                  onChange={() => setApplyToAll(false)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('selectedPages')}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={applyToAll}
                  onChange={() => setApplyToAll(true)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('allPages')}
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
