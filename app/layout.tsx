import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#070707' },
  ],
};

export const metadata: Metadata = {
  title: 'Dra. Sâmara Souza - Estética Avançada',
  description: 'Sistema de Gestão Clínica, Agendamentos, Prontuário e Ficha de Anamnese',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dra. Sâmara',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: '/Samara_logo.png',
        type: 'image/png',
      },
      {
        url: '/favicon.ico',
      },
    ],
    shortcut: '/Samara_logo.png',
    apple: '/Samara_logo.png',
  },
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Samara_logo.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/Samara_logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('samara_theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white text-black dark:bg-[#070707] dark:text-white transition-colors duration-150">
        {children}
        <Toaster position="top-center" closeButton />
        <Analytics />
      </body>
    </html>
  )
}
