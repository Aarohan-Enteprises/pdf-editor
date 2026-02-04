'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function PdfToDocxPage() {
  const t = useTranslations('tools.pdfToDocx');

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('converted-document');
  const [convertedData, setConvertedData] = useState<Uint8Array | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [engine, setEngine] = useState<'pymupdf' | 'libreoffice' | 'poppler' | 'pdf2docx'>('pymupdf');
  const [engineUsed, setEngineUsed] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setUploadError(null);
    setConvertedData(null);
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      const name = selectedFiles[0].name.replace(/\.pdf$/i, '');
      setOutputFilename(name);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStage('uploading');
    setUploadError(null);
    setConvertedData(null);
    setEngineUsed(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('engine', engine);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const { response, conversionEngine } = await new Promise<{ response: Response; conversionEngine: string | null }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiUrl}/api/pdf-to-docx`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.upload.onloadend = () => {
          setProcessingStage('processing');
        };

        xhr.onload = () => {
          const engineHeader = xhr.getResponseHeader('X-Conversion-Engine');
          resolve({
            response: new Response(xhr.response, {
              status: xhr.status,
            }),
            conversionEngine: engineHeader,
          });
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.responseType = 'blob';
        xhr.send(formData);
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to convert PDF to DOCX');
      }

      const convertedBlob = await response.blob();
      const data = new Uint8Array(await convertedBlob.arrayBuffer());

      setConvertedData(data);
      setEngineUsed(conversionEngine);
      setProcessingStage('done');
    } catch (error) {
      console.error('Conversion failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to convert PDF to DOCX');
      setProcessingStage('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [file, engine]);

  const clearFile = useCallback(() => {
    setFile(null);
    setConvertedData(null);
    setUploadError(null);
    setOutputFilename('converted-document');
    setProcessingStage('idle');
    setEngineUsed(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (convertedData) {
      const blob = new Blob([new Uint8Array(convertedData)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${outputFilename.trim() || 'converted-document'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [convertedData, outputFilename]);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('pageTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('pageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Dropzone and Options */}
          <div className="space-y-4">
            <div className="card p-4">
              <PDFDropzone
                onFilesSelected={handleFilesSelected}
                isLoading={false}
                externalError={uploadError}
                onClearError={() => setUploadError(null)}
              />

              {file && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="card p-4 space-y-4">
                {/* Conversion Engine */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Conversion Engine
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      engine === 'pymupdf'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="engine"
                        value="pymupdf"
                        checked={engine === 'pymupdf'}
                        onChange={(e) => setEngine(e.target.value as 'pymupdf' | 'libreoffice' | 'poppler' | 'pdf2docx')}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">PyMuPDF (Advanced)</span>
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Recommended</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Preserves text formatting, images, and horizontal lines
                        </p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      engine === 'libreoffice'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="engine"
                        value="libreoffice"
                        checked={engine === 'libreoffice'}
                        onChange={(e) => setEngine(e.target.value as 'pymupdf' | 'libreoffice' | 'poppler' | 'pdf2docx')}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">LibreOffice</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Basic conversion, faster but may lose complex formatting
                        </p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      engine === 'poppler'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="engine"
                        value="poppler"
                        checked={engine === 'poppler'}
                        onChange={(e) => setEngine(e.target.value as 'pymupdf' | 'libreoffice' | 'poppler' | 'pdf2docx')}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">Poppler + Pandoc</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          PDF→HTML→DOCX pipeline (complex mode)
                        </p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      engine === 'pdf2docx'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="engine"
                        value="pdf2docx"
                        checked={engine === 'pdf2docx'}
                        onChange={(e) => setEngine(e.target.value as 'pymupdf' | 'libreoffice' | 'poppler' | 'pdf2docx')}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">pdf2docx</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Dedicated converter - preserves layout, lines, and tables
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Output Filename */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Output filename
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={outputFilename}
                      onChange={(e) => setOutputFilename(e.target.value)}
                      placeholder="converted-document"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                    <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                      .docx
                    </span>
                  </div>
                </div>

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={isProcessing || !file}
                  className="btn btn-primary w-full"
                >
                  {isProcessing ? t('converting') : t('convert')}
                </button>
              </div>
            )}
          </div>

          {/* Right: Status/Results */}
          <div className="space-y-4">
            {/* Processing Status */}
            {isProcessing && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-6">
                  Processing...
                </h3>
                <div className="space-y-4">
                  {/* Uploading */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        processingStage === 'uploading'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : processingStage === 'processing'
                          ? 'bg-blue-500'
                          : 'bg-gray-100 dark:bg-slate-800'
                      }`}>
                        {processingStage === 'uploading' ? (
                          <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : processingStage === 'processing' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`text-sm ${
                          processingStage === 'uploading'
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : processingStage === 'processing'
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          Uploading file...
                        </span>
                        {processingStage === 'uploading' && (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {uploadProgress}%
                          </span>
                        )}
                      </div>
                    </div>
                    {processingStage === 'uploading' && (
                      <div className="ml-11">
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Processing */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      processingStage === 'processing'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-slate-800'
                    }`}>
                      {processingStage === 'processing' ? (
                        <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      processingStage === 'processing'
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      Converting with {engine === 'pymupdf' ? 'PyMuPDF' : 'LibreOffice'}...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {convertedData && !isProcessing && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('success')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('successDescription')}
                    </p>
                  </div>
                </div>

                {/* File size info */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Output size</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatFileSize(convertedData.length)}
                    </span>
                  </div>
                  {engineUsed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Converted with</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {engineUsed === 'pymupdf' ? 'PyMuPDF' : 'LibreOffice'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Word Document
                </button>
              </div>
            )}

            {!isProcessing && !convertedData && (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {file ? 'Ready to convert' : 'No PDF selected'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {file
                    ? 'Click Convert to Word to start'
                    : 'Upload a PDF file to convert it to Word'}
                </p>
              </div>
            )}

            {/* Server-side Notice */}
            <div className="card p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-medium mb-1">Secure server processing</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Your file is encrypted during transfer, processed using {engine === 'pymupdf' ? 'PyMuPDF' : 'LibreOffice'}, and automatically deleted after conversion.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium mb-1">{t('infoTitle')}</p>
                  <p className="text-amber-600 dark:text-amber-400">
                    {t('infoDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
