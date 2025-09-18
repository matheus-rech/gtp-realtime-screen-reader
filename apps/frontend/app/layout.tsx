import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Realtime Vision Assistant',
  description: 'Voice and vision multimodal assistant powered by OpenAI Realtime API'
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className={`${inter.className} bg-slate-950 text-slate-100`}>{children}</body>
  </html>
);

export default RootLayout;
