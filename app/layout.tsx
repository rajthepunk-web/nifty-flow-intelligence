import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const jetBrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Nifty Flow Intelligence',
  description: 'A market environment intelligence terminal for NIFTY 50 options.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${jetBrains.variable} font-sans`}>{children}</body>
    </html>
  );
}
