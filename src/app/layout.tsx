import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Script from 'next/script';
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
    canonical: `${BASE_URL}/`,
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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is PDF2.in really free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, PDF2.in is completely free with no hidden fees, no premium tiers, and no usage limits. Every PDF tool — from merging and splitting to compressing and converting — is available at no cost. No account or signup required.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are my files safe and private?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PDF2.in processes your documents entirely within your web browser using client-side JavaScript. Your PDF files are never uploaded to a remote server. Once you close the tab, your files are gone from memory.',
        },
      },
      {
        '@type': 'Question',
        name: 'What PDF tools are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PDF2.in offers over 20 tools including merge, split, rotate, delete pages, compress, add watermarks, page numbers, signatures, redact content, edit metadata, and convert between PDF, Word, and image formats.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to install any software?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. PDF2.in is a web-based PDF editor that works directly in your browser on any device. There is nothing to download or install.',
        },
      },
      {
        '@type': 'Question',
        name: 'What file formats are supported for conversion?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can convert PDF to Word (DOCX), PDF to JPG, PNG, or WebP images, and vice versa. Image-to-PDF supports JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC, and SVG formats.',
        },
      },
    ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-slate-900">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-M3016T048R"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-M3016T048R');
          `}
        </Script>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
