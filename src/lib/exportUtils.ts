/**
 * Utility functions for exporting data to CSV and PDF
 */

/**
 * Convert an array of objects to CSV string
 */
export function jsonToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
): string {
  const cell = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (typeof value === "string" && /^[\s]*[=+\-@\t\r\n]/.test(text))
      text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const header = columns.map((col) => cell(col.label)).join(",");

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        return cell(value);
      })
      .join(","),
  );

  return [header, ...rows].join("\n");
}

/**
 * Trigger CSV file download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a simple HTML-based printable PDF (opens print dialog)
 */
export function generatePrintablePDF(
  title: string,
  content: string,
  footer?: string,
): boolean {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to generate PDF");
    return false;
  }

  const html = `
     <!DOCTYPE html>
     <html>
     <head>
       <title>${escapeHTML(title)}</title>
       <style>
         body {
           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           padding: 40px;
           color: #1a1a2e;
         }
         h1 {
           color: #1e40af;
           border-bottom: 2px solid #1e40af;
           padding-bottom: 10px;
         }
         table {
           width: 100%;
           border-collapse: collapse;
           margin-top: 20px;
         }
         th, td {
           border: 1px solid #ddd;
           padding: 10px;
           text-align: left;
         }
         th {
           background-color: #1e40af;
           color: white;
         }
         tr:nth-child(even) {
           background-color: #f8fafc;
         }
         .footer {
           margin-top: 40px;
           padding-top: 20px;
           border-top: 1px solid #ddd;
           color: #666;
           font-size: 12px;
         }
         @media print {
           body { padding: 20px; }
         }
       </style>
     </head>
     <body>
       <h1>${escapeHTML(title)}</h1>
       ${content}
       ${footer ? `<div class="footer">${escapeHTML(footer)}</div>` : ""}
     </body>
     </html>
   `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
  return true;
}

export function escapeHTML(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

/**
 * Format date for display
 */
export function formatDateForExport(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format currency for display
 */
export function formatCurrencyForExport(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}
