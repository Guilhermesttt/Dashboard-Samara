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
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
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
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Samara_logo.png" type="image/png" sizes="any" />
        <link rel="preload" href="/fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('samara_theme') === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white text-black dark:bg-[#111111] dark:text-[#ffffff] transition-colors duration-150">
        {children}
        <Toaster position="top-center" closeButton />
        <Analytics />
      </body>
    </html>
  )
}
