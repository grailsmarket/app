import { type ClassValue, clsx } from 'clsx'
import { twMerge as tailwindMerge } from 'tailwind-merge'

export function cn(...args: ClassValue[]): string {
  return tailwindMerge(clsx(...args))
}
