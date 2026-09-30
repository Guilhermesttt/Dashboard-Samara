'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4.5 shrink-0 rounded-md border border-black/20 dark:border-white/20 bg-transparent dark:bg-[#1a1a1a] shadow-xs transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none cursor-pointer',
        'data-[state=checked]:bg-[#A8B29A] data-[state=checked]:text-[#111111] data-[state=checked]:border-[#A8B29A] font-bold',
        'focus-visible:ring-2 focus-visible:ring-[#A8B29A]/50 focus-visible:border-[#A8B29A] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
