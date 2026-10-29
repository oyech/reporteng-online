import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReportEng — Engineering Workspace',
  description: 'Laporan Pekerjaan, Laporan DW, Kode Item, Pricelist, dan Logsheet Engineering',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon_16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon_64x64.png', sizes: '64x64', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#163f36" />
      </head>
      <body>{children}</body>
    </html>
  );
}
