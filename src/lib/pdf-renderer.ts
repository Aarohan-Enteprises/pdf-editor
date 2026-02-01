import * as pdfjsLib from 'pdfjs-dist';

let workerInitialized = false;

export function initPDFWorker(): void {
  if (workerInitialized) return;

  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    workerInitialized = true;
  }
}

export interface RenderOptions {
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export async function renderPageToCanvas(
  pdfData: ArrayBuffer,
  pageNumber: number,
  options: RenderOptions = {}
): Promise<string> {
  initPDFWorker();

  const { scale = 1, maxWidth = 200, maxHeight = 280 } = options;

  // Clone the ArrayBuffer to prevent "detached" errors when pdf.js transfers it to worker
  const clonedData = pdfData.slice(0);

  const pdf = await pdfjsLib.getDocument({ data: clonedData }).promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 1 });

  const widthScale = maxWidth / viewport.width;
  const heightScale = maxHeight / viewport.height;
  const finalScale = Math.min(widthScale, heightScale, scale);

  const scaledViewport = page.getViewport({ scale: finalScale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/png');

  pdf.destroy();

  return dataUrl;
}

export async function renderAllPages(
  pdfData: ArrayBuffer,
  options: RenderOptions = {}
): Promise<string[]> {
  initPDFWorker();

  // Clone the ArrayBuffer to prevent "detached" errors
  const clonedData = pdfData.slice(0);

  const pdf = await pdfjsLib.getDocument({ data: clonedData }).promise;
  const numPages = pdf.numPages;
  const thumbnails: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });

    const { maxWidth = 200, maxHeight = 280 } = options;
    const widthScale = maxWidth / viewport.width;
    const heightScale = maxHeight / viewport.height;
    const finalScale = Math.min(widthScale, heightScale);

    const scaledViewport = page.getViewport({ scale: finalScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
    }).promise;

    thumbnails.push(canvas.toDataURL('image/png'));
  }

  pdf.destroy();

  return thumbnails;
}

export async function getPDFInfo(pdfData: ArrayBuffer): Promise<{
  numPages: number;
  title?: string;
}> {
  initPDFWorker();

  // Clone the ArrayBuffer to prevent "detached" errors
  const clonedData = pdfData.slice(0);

  const pdf = await pdfjsLib.getDocument({ data: clonedData }).promise;
  const metadata = await pdf.getMetadata();

  const result = {
    numPages: pdf.numPages,
    title: (metadata.info as Record<string, unknown>)?.Title as string | undefined,
  };

  pdf.destroy();

  return result;
}
