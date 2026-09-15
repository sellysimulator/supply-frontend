import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/* One shared control surface, so inputs, textareas and selects are
   indistinguishable from each other except in behaviour. */
const CONTROL =
  'w-full rounded-md border border-border bg-card px-3 text-sm text-foreground ' +
  'placeholder:text-muted-foreground transition-colors duration-200 ' +
  'hover:border-muted-foreground/40 disabled:opacity-50'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(CONTROL, 'min-h-28 py-2.5 leading-relaxed', className)} {...props} />
  )
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, 'h-11 cursor-pointer pr-8', className)} {...props} />
}
