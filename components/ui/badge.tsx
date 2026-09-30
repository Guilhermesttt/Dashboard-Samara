import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all select-none',
  {
    variants: {
      variant: {
        default:
          'border-[#A8B29A]/30 bg-[#A8B29A]/15 text-[#111111] dark:text-[#A8B29A]',
        sage:
          'border-[#A8B29A]/30 bg-[#A8B29A]/15 text-[#111111] dark:text-[#A8B29A]',
        secondary:
          'border-black/10 dark:border-white/15 bg-black/5 dark:bg-[#232323] text-black dark:text-white',
        destructive:
          'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400',
        warning:
          'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400',
        success:
          'border-[#8D9B7F]/40 bg-[#8D9B7F]/15 text-[#4e5843] dark:text-[#A8B29A]',
        outline:
          'border-black/15 dark:border-white/20 text-black dark:text-white bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
  pulse?: boolean
}

function Badge({
  className,
  variant,
  pulse = false,
  children,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
