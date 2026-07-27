import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ToastContainer from '@/components/ToastContainer';
import ProblemModal from '@/components/ProblemModal';
// import { Agentation } from "agentation";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LC Company Tracker',
  description: 'Track and solve LeetCode company-wise interview questions efficiently.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-background text-foreground select-none transition-colors duration-200">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans flex h-screen overflow-hidden`}>
        <Providers>
          {/* Sidebar */}
          <Sidebar />

          {/* Main workspace */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background">
            {/* Topbar */}
            <Navbar />

            {/* Scrollable content canvas */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-background/90">
              {children}
            </main>
          </div>

          {/* Global Modals & Toasts */}
          <ProblemModal />
          <ToastContainer />
        </Providers>
          {/* {process.env.NODE_ENV === "development" && <Agentation />} */}
      </body>
    </html>
  );
}
