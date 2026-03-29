import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// ✅ FIXED DATE (handles Excel numbers)
export function formatDate(
    value: string | number | null | undefined
): string {
    if (value === null || value === undefined || value === "") {
        return "......../......../202...";
    }

    try {
        if (typeof value === "number") {
            const excelEpochOffset = 25569;
            const ms = (value - excelEpochOffset) * 86400 * 1000;
            const date = new Date(ms);

            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString("fr-FR");
            }
        }

        if (
            typeof value === "string" &&
            /^[0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{4}$/.test(value)
        ) {
            const [d, m, y] = value.split(/[-/]/);
            return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
        }

        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("fr-FR");
        }

        return String(value);
    } catch {
        return String(value);
    }
}

// ✅ RESTORED
export function formatTime(
    value: string | null | undefined
): string {
    if (!value) return "--h--";

    try {
        const parts = value.split(/[:\-h]/i);
        if (parts.length >= 2) {
            const h = parts[0].padStart(2, "0");
            const m = parts[1].padStart(2, "0");
            return `${h}h${m}`;
        }

        return value;
    } catch {
        return value;
    }
}

// ✅ OPTIONAL (if used)
export function formatFullTime(
    value: string | null | undefined
): string {
    if (!value) return "--:--:--";

    try {
        const parts = value.split(/[:\-h]/i);
        const h = (parts[0] || "00").padStart(2, "0");
        const m = (parts[1] || "00").padStart(2, "0");
        const s = (parts[2] || "00").padStart(2, "0");

        return `${h}:${m}:${s}`;
    } catch {
        return value || "--:--:--";
    }
}