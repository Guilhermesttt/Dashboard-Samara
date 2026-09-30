import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-xl border border-black/15 dark:border-white/15 bg-[#fcfcfc] dark:bg-[#1a1a1a] px-3.5 py-2 text-sm text-black dark:text-white placeholder:text-[#8f8f8f] dark:placeholder:text-[#6c6c6c] shadow-xs transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 focus-visible:ring-[#A8B29A]/50 focus-visible:border-[#A8B29A] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'aria-invalid:ring-2 aria-invalid:ring-destructive/30 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
