'use client'

import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Toaster() {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastPrimitive.Viewport
        className={cn(
          'fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[100vw]'
        )}
      />
    </ToastPrimitive.Provider>
  )
}

type ToastProps = {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

export function Toast({ title, description, variant = 'default' }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-2xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[swipe=end]:animate-out data-[state=closed]:slide-out-to-right-full',
        variant === 'success' && 'bg-emerald-950 border-emerald-700 text-emerald-100',
        variant === 'error' && 'bg-red-950 border-red-700 text-red-100',
        variant === 'default' && 'bg-gray-900 border-gray-700 text-gray-100'
      )}
    >
      <div className="flex-1">
        <ToastPrimitive.Title className="font-semibold text-sm">{title}</ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="text-xs opacity-75 mt-0.5">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="opacity-50 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}
