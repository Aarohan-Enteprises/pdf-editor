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
  const blob = new Blob([new Uint8Array(data)], { type: 'application/pdf' });
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

export async function imagesToPDF(
  images: { data: ArrayBuffer; type: string }[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const image of images) {
    let pdfImage;

    if (image.type === 'image/jpeg' || image.type === 'image/jpg') {
      pdfImage = await pdf.embedJpg(image.data);
    } else if (image.type === 'image/png') {
      pdfImage = await pdf.embedPng(image.data);
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

