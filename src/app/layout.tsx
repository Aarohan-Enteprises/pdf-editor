import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'PDF2.in - Free & Secure PDF Tools',
  description: 'Edit, merge, split, rotate, and convert PDFs instantly. 100% free, secure, and works entirely in your browser.',
  keywords: 'PDF editor, merge PDF, split PDF, rotate PDF, watermark, image to PDF, free PDF tools',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-slate-900">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
