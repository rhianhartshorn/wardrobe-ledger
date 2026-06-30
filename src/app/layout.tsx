import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'The Wardrobe Ledger',
  description: 'Personal wardrobe inventory & AI stylist',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <ChunkErrorRecovery />
        {children}
      </body>
    </html>
  );
}
