import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Realtime Vision Assistant',
  description: 'Multimodal assistant powered by OpenAI Realtime API'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-white">{children}</body>
    </html>
  );
}
