import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface PageInfo {
  id: string;
  pageIndex: number;
  sourceIndex: number;
  rotation: number;
  thumbnail?: string;
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
  opacity: number;
  position: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export class EncryptedPDFError extends Error {
  constructor(message: string = 'This PDF is password protected or encrypted') {
    super(message);
    this.name = 'EncryptedPDFError';
  }
}

export async function checkPDFEncryption(data: ArrayBuffer | Uint8Array): Promise<boolean> {
  try {
    // Try loading without ignoreEncryption - if it fails, the PDF is encrypted
    await PDFDocument.load(data, { ignoreEncryption: false });
    return false; // Not encrypted
  } catch (error) {
    // Check if the error is related to encryption
    if (error instanceof Error &&
        (error.message.includes('encrypted') ||
         error.message.includes('password') ||
         error.message.includes('decrypt'))) {
      return true; // Encrypted
    }
    // Re-throw if it's a different error
    throw error;
  }
}

export async function loadPDF(data: ArrayBuffer | Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(data, { ignoreEncryption: true });
}

export async function mergePDFs(pdfDataList: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const pdfData of pdfDataList) {
    const pdf = await loadPDF(pdfData);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

export async function mergePDFsWithOrder(
  pdfDataList: ArrayBuffer[],
  pageOrder: PageInfo[]
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const loadedPdfs: PDFDocument[] = [];

  for (const pdfData of pdfDataList) {
    loadedPdfs.push(await loadPDF(pdfData));
  }

  for (const pageInfo of pageOrder) {
    const sourcePdf = loadedPdfs[pageInfo.sourceIndex];
    if (!sourcePdf) continue;

    const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [pageInfo.pageIndex]);

    if (pageInfo.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees(currentRotation + pageInfo.rotation));
    }

    mergedPdf.addPage(copiedPage);
  }

  return mergedPdf.save();
}

export async function splitPDF(
  pdfData: ArrayBuffer | Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const sourcePdf = await loadPDF(pdfData);
  const newPdf = await PDFDocument.create();

  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

export async function splitPDFToIndividual(
  pdfData: ArrayBuffer | Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array[]> {
  const sourcePdf = await loadPDF(pdfData);
  const results: Uint8Array[] = [];

  for (const pageIndex of pageIndices) {
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
    newPdf.addPage(page);
    results.push(await newPdf.save());
  }

  return results;
}

export async function rotatePage(
  pdfData: ArrayBuffer | Uint8Array,
  pageIndex: number,
  rotationDegrees: number
): Promise<Uint8Array> {
  const pdf = await loadPDF(pdfData);
  const page = pdf.getPage(pageIndex);
  const currentRotation = page.getRotation().angle;
  page.setRotation(degrees(currentRotation + rotationDegrees));
  return pdf.save();
}

export async function rotatePages(
  pdfData: ArrayBuffer | Uint8Array,
  pageIndices: number[],
  rotationDegrees: number
): Promise<Uint8Array> {
  const pdf = await loadPDF(pdfData);

  for (const pageIndex of pageIndices) {
    const page = pdf.getPage(pageIndex);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + rotationDegrees));
  }

  return pdf.save();
}

export async function addWatermark(
  pdfData: ArrayBuffer | Uint8Array,
  options: WatermarkOptions,
  pageIndices?: number[]
): Promise<Uint8Array> {
  const pdf = await loadPDF(pdfData);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  const targetPages = pageIndices
    ? pageIndices.map((i) => pages[i]).filter(Boolean)
    : pages;

  for (const page of targetPages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = options.fontSize;

    let x: number;
    let y: number;

    switch (options.position) {
      case 'topLeft':
        x = 20;
        y = height - textHeight - 20;
        break;
      case 'topRight':
        x = width - textWidth - 20;
        y = height - textHeight - 20;
        break;
      case 'bottomLeft':
        x = 20;
        y = 20;
        break;
      case 'bottomRight':
        x = width - textWidth - 20;
        y = 20;
        break;
      case 'center':
      default:
        x = (width - textWidth) / 2;
        y = (height - textHeight) / 2;
        break;
    }

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(options.color.r, options.color.g, options.color.b),
      opacity: options.opacity,
    });
  }

  return pdf.save();
}

export async function getPDFPageCount(pdfData: ArrayBuffer | Uint8Array): Promise<number> {
  const pdf = await loadPDF(pdfData);
  return pdf.getPageCount();
}

export function downloadPDF(data: Uint8Array, filename: string): void {
  const blob = new Blob([data.slice()], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadMultiplePDFs(
  pdfs: { data: Uint8Array; filename: string }[]
): Promise<void> {
  for (const pdf of pdfs) {
    downloadPDF(pdf.data, pdf.filename);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function splitPDFAtPage(
  pdfData: ArrayBuffer | Uint8Array,
  splitAfterPage: number
): Promise<{ firstPart: Uint8Array; secondPart: Uint8Array }> {
  const sourcePdf = await loadPDF(pdfData);
  const totalPages = sourcePdf.getPageCount();

  if (splitAfterPage < 1 || splitAfterPage >= totalPages) {
    throw new Error(`Invalid split page. Must be between 1 and ${totalPages - 1}`);
  }

  const firstPdf = await PDFDocument.create();
  const secondPdf = await PDFDocument.create();

  const firstPageIndices = Array.from({ length: splitAfterPage }, (_, i) => i);
  const secondPageIndices = Array.from(
    { length: totalPages - splitAfterPage },
    (_, i) => splitAfterPage + i
  );

  const firstPages = await firstPdf.copyPages(sourcePdf, firstPageIndices);
  firstPages.forEach((page) => firstPdf.addPage(page));

  const secondPages = await secondPdf.copyPages(sourcePdf, secondPageIndices);
  secondPages.forEach((page) => secondPdf.addPage(page));

  return {
    firstPart: await firstPdf.save(),
    secondPart: await secondPdf.save(),
  };
}

export interface SignatureOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

export async function addSignatureImage(
  pdfData: ArrayBuffer | Uint8Array,
  imageData: ArrayBuffer,
  imageType: string,
  options: SignatureOptions
): Promise<Uint8Array> {
  const pdf = await loadPDF(pdfData);

  let pdfImage;
  if (imageType === 'image/png') {
    pdfImage = await pdf.embedPng(imageData);
  } else {
    pdfImage = await pdf.embedJpg(imageData);
  }

  const page = pdf.getPage(options.pageIndex);
  page.drawImage(pdfImage, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
  });

  return pdf.save();
}

export async function insertBlankPages(
  pdfData: ArrayBuffer | Uint8Array,
  positions: number[],
  pageSize: { width: number; height: number } = { width: 595, height: 842 } // A4 default
): Promise<Uint8Array> {
  const sourcePdf = await loadPDF(pdfData);
  const newPdf = await PDFDocument.create();
  const pageCount = sourcePdf.getPageCount();

  // Copy all pages and insert blanks at specified positions
  let insertedCount = 0;
  for (let i = 0; i < pageCount; i++) {
    // Check if we need to insert a blank page before this page
    while (positions.includes(i + insertedCount)) {
      newPdf.addPage([pageSize.width, pageSize.height]);
      insertedCount++;
    }
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
    newPdf.addPage(copiedPage);
  }

  // Check if we need to insert blank pages at the end
  while (positions.includes(pageCount + insertedCount)) {
    newPdf.addPage([pageSize.width, pageSize.height]);
    insertedCount++;
  }

  return newPdf.save();
}

export async function duplicatePages(
  pdfData: ArrayBuffer | Uint8Array,
  pageIndices: number[],
  times: number = 1
): Promise<Uint8Array> {
  const sourcePdf = await loadPDF(pdfData);
  const newPdf = await PDFDocument.create();

  for (const pageIndex of pageIndices) {
    for (let i = 0; i <= times; i++) {
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex]);
      newPdf.addPage(copiedPage);
    }
  }

  return newPdf.save();
}

export async function reversePageOrder(
  pdfData: ArrayBuffer | Uint8Array
): Promise<Uint8Array> {
  const sourcePdf = await loadPDF(pdfData);
  const newPdf = await PDFDocument.create();
  const pageCount = sourcePdf.getPageCount();

  const reversedIndices = Array.from({ length: pageCount }, (_, i) => pageCount - 1 - i);
  const pages = await newPdf.copyPages(sourcePdf, reversedIndices);
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

// Convert any image to PNG using Canvas API (for formats not natively supported by pdf-lib)
async function convertImageToPng(data: ArrayBuffer, type: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (pngBlob) {
          pngBlob.arrayBuffer().then(resolve).catch(reject);
        } else {
          reject(new Error('Failed to convert image to PNG'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Supported image formats that can be converted to PDF
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
];

export async function imagesToPDF(
  images: { data: ArrayBuffer; type: string }[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const image of images) {
    let pdfImage;
    let imageData = image.data;
    let imageType = image.type;

    // Convert non-JPG/PNG formats to PNG first
    if (imageType !== 'image/jpeg' && imageType !== 'image/jpg' && imageType !== 'image/png') {
      try {
        imageData = await convertImageToPng(image.data, image.type);
        imageType = 'image/png';
      } catch (err) {
        console.error('Failed to convert image:', err);
        continue;
      }
    }

    if (imageType === 'image/jpeg' || imageType === 'image/jpg') {
      pdfImage = await pdf.embedJpg(imageData);
    } else if (imageType === 'image/png') {
      pdfImage = await pdf.embedPng(imageData);
    } else {
      continue;
    }

    const { width, height } = pdfImage;
    const page = pdf.addPage([width, height]);
    page.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return pdf.save();
}

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
}

export async function editMetadata(
  pdfData: ArrayBuffer | Uint8Array,
  metadata: PDFMetadata
): Promise<Uint8Array> {
  const pdf = await loadPDF(pdfData);

  if (metadata.title) pdf.setTitle(metadata.title);
  if (metadata.author) pdf.setAuthor(metadata.author);
  if (metadata.subject) pdf.setSubject(metadata.subject);
  if (metadata.keywords) pdf.setKeywords([metadata.keywords]);
  if (metadata.creator) pdf.setCreator(metadata.creator);
  pdf.setProducer('PDF2.in');
  pdf.setModificationDate(new Date());

  return pdf.save();
}

export async function getMetadata(
  pdfData: ArrayBuffer | Uint8Array
): Promise<PDFMetadata> {
  const pdf = await loadPDF(pdfData);
  return {
    title: pdf.getTitle() || '',
    author: pdf.getAuthor() || '',
    subject: pdf.getSubject() || '',
    keywords: pdf.getKeywords() || '',
    creator: pdf.getCreator() || '',
  };
}

export interface PageNumberOptions {
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
  format: 'number' | 'pageOfTotal' | 'dash';
  fontSize: number;
  startNumber: number;
  margin: number;
}

export async function addPageNumbers(
  pdfData: ArrayBuffer | Uint8Array,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const pdf = await loadPDF(pdfData);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const totalPages = pages.length;

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const pageNum = index + options.startNumber;

    let text: string;
    switch (options.format) {
      case 'pageOfTotal':
        text = `Page ${pageNum} of ${totalPages + options.startNumber - 1}`;
        break;
      case 'dash':
        text = `- ${pageNum} -`;
        break;
      case 'number':
      default:
        text = `${pageNum}`;
        break;
    }

    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    let x: number;
    let y: number;

    switch (options.position) {
      case 'top-left':
        x = options.margin;
        y = height - options.margin;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - options.margin;
        break;
      case 'top-right':
        x = width - textWidth - options.margin;
        y = height - options.margin;
        break;
      case 'bottom-left':
        x = options.margin;
        y = options.margin;
        break;
      case 'bottom-right':
        x = width - textWidth - options.margin;
        y = options.margin;
        break;
      case 'bottom-center':
      default:
        x = (width - textWidth) / 2;
        y = options.margin;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  });

  return pdf.save();
}

export interface RedactionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageRedaction {
  pageIndex: number;
  areas: RedactionArea[];
}

export type RedactionStyle = 'solid' | 'redacted' | 'confidential' | 'sensitive' | 'hidden' | 'classified';

const redactionStyleText: Record<RedactionStyle, string> = {
  solid: '',
  redacted: 'REDACTED',
  confidential: 'CONFIDENTIAL',
  sensitive: 'SENSITIVE',
  hidden: '[HIDDEN]',
  classified: 'CLASSIFIED',
};

// Create a black redaction image with optional text label
async function createRedactionImage(
  width: number,
  height: number,
  labelText: string
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    // Use higher resolution for crisp text
    const scale = 2;
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d')!;

    // Fill with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text label if provided
    if (labelText) {
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Calculate font size to fit
      let fontSize = Math.min(canvas.height * 0.6, 28);
      ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;

      // Reduce font size if text is too wide
      while (ctx.measureText(labelText).width > canvas.width - 8 && fontSize > 10) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
      }

      if (fontSize >= 10) {
        ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);
      }
    }

    canvas.toBlob((blob) => {
      if (blob) {
        blob.arrayBuffer().then(resolve).catch(reject);
      } else {
        reject(new Error('Failed to create redaction image'));
      }
    }, 'image/png');
  });
}

export async function applyRedactions(
  pdfData: ArrayBuffer | Uint8Array,
  redactions: PageRedaction[],
  style: RedactionStyle = 'solid'
): Promise<Uint8Array> {
  const pdf = await loadPDF(pdfData);
  const labelText = redactionStyleText[style];

  for (const pageRedaction of redactions) {
    const page = pdf.getPage(pageRedaction.pageIndex);

    for (const area of pageRedaction.areas) {
      // Create a rasterized black image for secure redaction
      // This ensures the redaction cannot be removed to reveal underlying content
      const redactionImageData = await createRedactionImage(
        area.width,
        area.height,
        labelText
      );

      // Embed the redaction image
      const redactionImage = await pdf.embedPng(redactionImageData);

      // Draw the redaction image over the area
      // This covers the content with an opaque image, not just a vector rectangle
      page.drawImage(redactionImage, {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      });
    }
  }

  return pdf.save();
}

