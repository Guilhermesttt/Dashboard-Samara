'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#767676] dark:text-[#8D9B7F] inline-flex h-10 w-fit items-center justify-center rounded-xl p-1 border border-black/10 dark:border-white/10 select-none',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none cursor-pointer active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        "text-[#767676] dark:text-[#8D9B7F] hover:text-black dark:hover:text-white",
        "data-[state=active]:bg-white dark:data-[state=active]:bg-[#2c2c2c] data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.4)] font-semibold",
        "focus-visible:ring-2 focus-visible:ring-[#A8B29A]/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none mt-2 animate-in fade-in-50 duration-150', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
