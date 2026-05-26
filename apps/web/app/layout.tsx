import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YourKalinga — Personal Care, Anytime',
  description:
    'YourKalinga connects patients with trusted Filipino doctors for virtual consultations. From the Filipino word kalinga — your care, your way.',
  keywords: 'telehealth, online doctor, consultation, Philippines, healthcare',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
