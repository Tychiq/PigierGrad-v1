export function formatDate(
    value: string | number | null | undefined
): string {
    if (value === null || value === undefined || value === "") {
        return "......../......../202...";
    }

    try {
        // ✅ Excel numeric date (e.g. 48756)
        if (typeof value === "number") {
            const excelEpochOffset = 25569; // days between 1899-12-30 and 1970-01-01
            const ms = (value - excelEpochOffset) * 86400 * 1000;
            const date = new Date(ms);

            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString("fr-FR");
            }
        }

        // ✅ Excel text date (DD/MM/YYYY or DD-MM-YYYY)
        if (typeof value === "string" && /^[0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{4}$/.test(value)) {
            const [d, m, y] = value.split(/[-/]/);
            return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
        }

        // ✅ ISO / JS date string
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("fr-FR");
        }

        return String(value);
    } catch {
        return String(value);
    }
}
