import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names, letting later classes win over earlier ones.
 * Every primitive uses this so a caller's `className` can always override a
 * variant default without fighting specificity.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
