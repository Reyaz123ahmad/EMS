import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes cleanly
 * @param  {...any} inputs 
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
