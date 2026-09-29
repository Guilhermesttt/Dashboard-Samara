'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#121212]/92 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-white/[0.12] group-[.toaster]:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] group-[.toaster]:rounded-2xl group-[.toaster]:p-3.5 group-[.toaster]:gap-3 group-[.toaster]:font-sans",
          description: "group-[.toast]:text-[#d3d3d3] group-[.toast]:text-[11px] group-[.toast]:leading-snug",
          title: "group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:text-xs group-[.toast]:tracking-tight",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-black group-[.toast]:font-semibold group-[.toast]:text-xs group-[.toast]:rounded-xl group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:hover:bg-[#eaeaea] group-[.toast]:active:scale-95 group-[.toast]:transition-all group-[.toast]:cursor-pointer",
          cancelButton:
            "group-[.toast]:bg-[#2c2c2e] group-[.toast]:text-white group-[.toast]:text-xs group-[.toast]:rounded-xl group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:hover:bg-[#3a3a3c] group-[.toast]:transition-all",
          closeButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white group-[.toast]:border-white/15 group-[.toast]:hover:bg-white/20 group-[.toast]:transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
