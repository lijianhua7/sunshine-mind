import type { Metadata } from 'next';
import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/AuthProvider';

const notoSans = Noto_Sans_SC({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

const notoSerif = Noto_Serif_SC({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Sunshine Mind',
  description: 'AI-driven emotion management and healing platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSans.variable} ${notoSerif.variable} font-sans bg-background text-foreground antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
