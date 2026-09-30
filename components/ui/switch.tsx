'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 focus-visible:ring-[#A8B29A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation select-none before:absolute before:-inset-2 before:content-[""]',
        'data-[state=checked]:bg-[#A8B29A] dark:data-[state=checked]:bg-[#A8B29A]',
        'data-[state=unchecked]:bg-[#dcdcdc] dark:data-[state=unchecked]:bg-[#333333]',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.25)] ring-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
