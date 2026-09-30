'use client'

import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[#A8B29A] data-[state=on]:text-[#111111] data-[state=on]:font-semibold [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-[#A8B29A]/50 outline-none transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] whitespace-nowrap cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: 'bg-transparent text-black dark:text-white',
        outline:
          'border border-black/15 dark:border-white/20 bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 data-[state=on]:border-[#A8B29A]',
      },
      size: {
        default: 'h-9 px-3 min-w-9',
        sm: 'h-8 px-2 min-w-8 text-xs rounded-lg',
        lg: 'h-11 px-4 min-w-11 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
