import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// ✅ FULL FRENCH DATE FORMAT
export function formatDate(
    value: string | number | null | undefined
): string {

    if (value === null || value === undefined || value === "") {
        return "........ ........ 202...";
    }

    try {

        let date: Date;

        // Excel numeric dates
        if (typeof value === "number") {
            const excelEpochOffset = 25569;
            const ms = (value - excelEpochOffset) * 86400 * 1000;
            date = new Date(ms);
        }

        // dd/mm/yyyy or dd-mm-yyyy
        else if (
            typeof value === "string" &&
            /^[0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{4}$/.test(value)
        ) {

            const [d, m, y] = value.split(/[-/]/);

            date = new Date(
                Number(y),
                Number(m) - 1,
                Number(d)
            );
        }

        else {
            date = new Date(value);
        }

        if (!isNaN(date.getTime())) {

            const formatted = date.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            });

            // Capitalize every word
            return formatted.replace(/\b\w/g, c => c.toUpperCase());
        }

        return String(value);

    } catch {
        return String(value);
    }
}

// ✅ START TIME → END TIME (+1h)
export function formatTime(
    value: string | null | undefined
): string {

    if (!value) return "--h--";

    try {

        const clean = value.replace("h", ":");

        const parts = clean.split(":");

        const startHour = parseInt(parts[0] || "0", 10);
        const minutes = (parts[1] || "00").padStart(2, "0");

        const endHour = startHour + 1;

        return `${startHour
            .toString()
            .padStart(2, "0")}h${minutes} - ${endHour
            .toString()
            .padStart(2, "0")}h${minutes}`;

    } catch {
        return value;
    }
}

// ✅ OPTIONAL
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


export const normalizeSpeciality = (s: string = "") => {
    return s
        .replace(/\s+/g, " ")          // collapse spaces
        .replace(/\s*\(\s*/g, " (")    // fix space before "("
        .replace(/\s*\)\s*/g, ") ")    // fix space after ")"
        .trim()
        .toUpperCase()
        .replace(/\(\s+/g, "(")        // remove space after (
        .replace(/\s+\)/g, ")")        // remove space before )
        .replace(/\s+/g, " ")
        .trim();
};