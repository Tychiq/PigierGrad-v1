import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "......../......../202...";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Handle DD-MM-YYYY or DD/MM/YYYY strings from Excel
      const parts = dateString.split(/[-/]/);
      if (parts.length === 3) {
        // Assume DD/MM/YYYY
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return dateString;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return "--h--";
  try {
    const parts = timeString.split(/[:\-h]/i);
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}h${m}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
}
