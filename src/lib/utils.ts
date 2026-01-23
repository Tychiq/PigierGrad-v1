export function formatDate(
    value: string | number | null | undefined
): string {
    if (!value) return "......../......../202...";

    try {
        // ✅ CASE 1: Excel numeric date (e.g. 44927)
        if (typeof value === "number") {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + value * 86400000);
            return date.toLocaleDateString("fr-FR");
        }

        // ✅ CASE 2: DD/MM/YYYY or DD-MM-YYYY (Excel text)
        if (typeof value === "string" && /\/|-/.test(value)) {
            const parts = value.split(/[-/]/);
            if (parts.length === 3 && parts[0].length <= 2) {
                const [d, m, y] = parts;
                return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
            }
        }

        // ✅ CASE 3: ISO or valid JS date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("fr-FR");
        }

        return value;
    } catch {
        return String(value);
    }
}
