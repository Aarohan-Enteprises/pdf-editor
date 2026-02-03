import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about PDF2.in - our mission to provide free, privacy-focused PDF tools. All processing happens in your browser. Contact us at contact@pdf2.in.',
  keywords: ['about PDF2.in', 'PDF tools', 'privacy', 'free PDF editor', 'contact'],
  openGraph: {
    title: 'About PDF2.in - Free Privacy-Focused PDF Tools',
    description: 'Learn about our mission to provide free, privacy-focused PDF tools. Your files never leave your device.',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
