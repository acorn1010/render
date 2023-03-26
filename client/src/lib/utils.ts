import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Wrapper around twMerge and clsx. Use this instead. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
