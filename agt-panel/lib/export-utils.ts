/**
 * Utility function to export JSON data to a CSV file and trigger a download.
 * @param data Array of objects containing the data to export.
 * @param filename Name of the file to be downloaded (without extension).
 * @param headers Optional array of header names for the CSV. If not provided, keys of the first object are used.
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
    if (!data || !data.length) {
        console.error("No data to export");
        return;
    }

    const csvRows: string[] = [];

    // Get headers
    const keys = Object.keys(data[0]);
    if (headers && headers.length) {
        csvRows.push(headers.map(header => `"${header}"`).join(","));
    } else {
        csvRows.push(keys.map(key => `"${key}"`).join(","));
    }

    // Get data rows
    for (const row of data) {
        const values = keys.map(key => {
            const val = row[key];
            // Handle null/undefined
            if (val === null || val === undefined) return '""';

            // Handle objects/arrays
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;

            // Handle strings (escape quotes)
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
    }

    // Combine rows into a single string
    const csvContent = csvRows.join("\n");

    // Create Blob with UTF-8 BOM (\uFEFF)
    const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
