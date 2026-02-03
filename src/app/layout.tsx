import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import './globals.css';

const BASE_URL = 'https://pdf2.in';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PDF2.in - Free Online PDF Editor & Tools',
    template: '%s | PDF2.in',
  },
  description: 'Edit, merge, split, compress, and convert PDFs online for free. 100% secure - all processing happens in your browser. No uploads, no registration required.',
  keywords: [
    'PDF editor',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'rotate PDF',
    'PDF to Word',
    'Word to PDF',
    'image to PDF',
    'PDF to image',
    'watermark PDF',
    'sign PDF',
    'free PDF tools',
    'online PDF editor',
    'secure PDF editor',
    'browser PDF editor',
  ],
  authors: [{ name: 'PDF2.in' }],
  creator: 'PDF2.in',
  publisher: 'PDF2.in',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'PDF2.in',
    title: 'PDF2.in - Free Online PDF Editor & Tools',
    description: 'Edit, merge, split, compress, and convert PDFs online for free. 100% secure - all processing happens in your browser.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PDF2.in - Free Online PDF Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF2.in - Free Online PDF Editor & Tools',
    description: 'Edit, merge, split, compress, and convert PDFs online for free. 100% secure - all processing happens in your browser.',
    images: ['/og-image.png'],
    creator: '@pdf2in',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: 'technology',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PDF2.in',
    url: BASE_URL,
    description: 'Free online PDF editor and tools. Edit, merge, split, compress, and convert PDFs securely in your browser.',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Merge PDF files',
      'Split PDF documents',
      'Compress PDF',
      'Rotate PDF pages',
      'Add watermark',
      'Convert images to PDF',
      'Convert PDF to images',
      'Add page numbers',
      'Sign PDF',
      'Edit PDF metadata',
    ],
    browserRequirements: 'Requires JavaScript. Works in modern browsers.',
    permissions: 'No account required. Files processed locally.',
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PDF2.in',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.svg`,
    sameAs: [],
  };

  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={BASE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-slate-900">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
