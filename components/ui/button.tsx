import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#A8B29A]/50 focus-visible:border-[#A8B29A] cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          'bg-[#A8B29A] text-[#111111] hover:bg-[#97a288] font-semibold shadow-sm shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.25)]',
        destructive:
          'bg-[#e23014] text-white hover:bg-[#c9250c] shadow-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] focus-visible:ring-destructive/30',
        outline:
          'border border-black/15 dark:border-white/20 bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10',
        secondary:
          'bg-[#232323] text-white hover:bg-[#2c2c2c] border border-black/15 dark:border-white/15 shadow-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        ghost:
          'text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10',
        sage:
          'bg-[#A8B29A]/15 text-[#A8B29A] hover:bg-[#A8B29A]/25 border border-[#A8B29A]/30',
        link: 'text-[#A8B29A] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2.5',
        lg: 'h-11 rounded-xl px-6 text-base has-[>svg]:px-4',
        icon: 'size-9 rounded-xl',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
