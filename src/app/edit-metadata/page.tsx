'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { editMetadata, getMetadata, downloadPDF } from '@/lib/pdf-operations';

export default function EditMetadataPage() {
  const t = useTranslations('tools.editMetadata');

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [creator, setCreator] = useState('');

  const loadMetadata = useCallback(async (selectedFile: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const metadata = await getMetadata(arrayBuffer);
      setTitle(metadata.title);
      setAuthor(metadata.author);
      setSubject(metadata.subject);
      setKeywords(metadata.keywords);
      setCreator(metadata.creator);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }
    setFile(selectedFile);
    setOutputFilename(selectedFile.name.replace('.pdf', '-edited'));
    setError(null);
    loadMetadata(selectedFile);
  }, [loadMetadata]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
    },
    [handleFile]
  );

  const handleSaveMetadata = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const resultData = await editMetadata(arrayBuffer, {
        title,
        author,
        subject,
        keywords,
        creator,
      });
      const filename = outputFilename.trim() || `edited-${file.name.replace('.pdf', '')}`;
      downloadPDF(resultData, `${filename}.pdf`);

      // Reset form
      setFile(null);
      setTitle('');
      setAuthor('');
      setSubject('');
      setKeywords('');
      setCreator('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to edit metadata:', err);
      setError('Failed to edit metadata. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, title, author, subject, keywords, creator, outputFilename]);

  const clearAll = useCallback(() => {
    setFile(null);
    setError(null);
    setTitle('');
    setAuthor('');
    setSubject('');
    setKeywords('');
    setCreator('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <div className="max-w-2xl mx-auto">
          <div className="card p-6 space-y-6">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {file ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">
                      Drop PDF file here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse
                    </p>
                  </>
                )}
              </div>
            </div>

            {file && (
              <>
                {isLoading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Loading metadata...</p>
                  </div>
                ) : (
                  <>
                    {/* Metadata Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Document title"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Author
                        </label>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="Author name"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Document subject"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Keywords
                        </label>
                        <input
                          type="text"
                          value={keywords}
                          onChange={(e) => setKeywords(e.target.value)}
                          placeholder="keyword1, keyword2, keyword3"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Creator Application
                        </label>
                        <input
                          type="text"
                          value={creator}
                          onChange={(e) => setCreator(e.target.value)}
                          placeholder="Application that created the document"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Output filename
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={outputFilename}
                            onChange={(e) => setOutputFilename(e.target.value)}
                            placeholder="document-edited"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                          />
                          <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                            .pdf
                          </span>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={clearAll}
                        className="btn btn-secondary flex-1"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleSaveMetadata}
                        disabled={isProcessing}
                        className="btn btn-primary flex-1"
                      >
                        {isProcessing ? 'Processing...' : 'Save Metadata'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
