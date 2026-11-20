/**
 * Lightweight RFC-4180 compliant CSV parser with support for quoted fields,
 * escaped quotes (""), commas/newlines inside quotes, and header normalization.
 */
export function parseCsvToRecords(csvContent: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  // Strip UTF-8 BOM if present
  const text = csvContent.replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++; // Skip \n
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  // Filter out completely blank lines
  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.length > 0));
  if (nonEmptyRows.length < 2) {
    return [];
  }

  const headerRow = nonEmptyRows[0] ?? [];
  const headers = headerRow.map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
  );

  const records: Record<string, string>[] = [];

  for (let r = 1; r < nonEmptyRows.length; r++) {
    const values = nonEmptyRows[r] ?? [];
    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (header) {
        record[header] = values[c] ?? '';
      }
    }
    records.push(record);
  }

  return records;
}
