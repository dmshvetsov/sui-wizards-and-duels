import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { baseUrl } from './config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function appUrl(path: string): string {
  return new URL(path, baseUrl).toString()
}
