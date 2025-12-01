import * as XLSX from 'xlsx';
import { ExcelData, FileState, ColumnMapping, DiffResult } from './types';

export const readExcelFile = (file: File): Promise<{ sheets: string[], workbook: XLSX.WorkBook }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve({ sheets: workbook.SheetNames, workbook });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const getSheetData = (workbook: XLSX.WorkBook, sheetName: string): ExcelData => {
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  if (!jsonData || jsonData.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = (jsonData[0] as string[]) || [];
  // Convert array of arrays to array of objects
  const rows = jsonData.slice(1).map((row: any) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return { headers, rows };
};

export const generateDiff = (
  files: FileState[],
  mappings: ColumnMapping[],
  keyFields: string[],
  diffFields: string[]
): DiffResult[] => {
  const results: Map<string, DiffResult> = new Map();

  // Helper to get mapped value from a file's row
  const getMappedValue = (fileId: string, row: any, targetField: string) => {
    const mapping = mappings.find(m => m.targetField === targetField);
    if (!mapping) return undefined;
    const sourceCol = mapping.sourceFields[fileId];
    if (!sourceCol) return undefined;
    return row[sourceCol];
  };

  files.forEach(file => {
    if (!file.data) return;

    file.data.rows.forEach(row => {
      // Generate composite key
      const keyValues = keyFields.map(k => String(getMappedValue(file.id, row, k) || '').trim());
      // If any part of the key is missing, we might still want to include it, but typically a key should be present.
      // Let's join them with a separator.
      const keyValue = keyValues.join(' | ');
      
      if (!keyValue || keyValues.every(k => k === '')) return; // Skip empty keys

      if (!results.has(keyValue)) {
        results.set(keyValue, {
          key: keyValue,
          rows: {},
          diffs: {},
          status: 'match'
        });
      }

      const result = results.get(keyValue)!;
      result.rows[file.id] = row;
    });
  });

  // Analyze diffs
  results.forEach(result => {
    let hasMismatch = false;
    let hasMissing = false;

    // Check if present in all files
    files.forEach(file => {
      if (!result.rows[file.id]) {
        hasMissing = true;
      }
    });

    // Check value diffs
    diffFields.forEach(field => {
      const values = new Set();
      files.forEach(file => {
        if (result.rows[file.id]) {
          const val = getMappedValue(file.id, result.rows[file.id], field);
          // Treat null/undefined as empty string for comparison to avoid false positives on empty cells
          values.add(String(val ?? '').trim());
        }
      });
      
      if (values.size > 1) {
        result.diffs[field] = true;
        hasMismatch = true;
      }
    });

    if (hasMissing) {
      result.status = 'missing';
    } else if (hasMismatch) {
      result.status = 'mismatch';
    }
  });

  return Array.from(results.values());
};
