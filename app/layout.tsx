import type {Metadata} from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Sunshine Mind',
  description: 'An AI-powered emotion tracking and healing platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased min-h-screen sunlight-bg text-[#2D3436] overflow-x-hidden relative" suppressHydrationWarning>
        <div className="dappled-shadows pointer-events-none fixed inset-0 -z-10" />
        <AuthProvider>
          {children}
          <Toaster position="top-center" toastOptions={{
             classNames: {
               toast: 'glass-panel text-[#2D3436]',
             }
          }} />
        </AuthProvider>
      </body>
    </html>
  );
}
