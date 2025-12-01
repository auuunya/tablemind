
export interface ExcelData {
  headers: string[];
  rows: any[];
}

export interface FileState {
  id: string;
  file: File;
  name: string;
  sheets: string[];
  selectedSheet: string | null;
  data: ExcelData | null;
  color: string; // Assign a color to each file for UI distinction
}

export interface ColumnMapping {
  targetField: string; // The unified field name
  sourceFields: Record<string, string>; // fileId -> columnName
}

export interface DiffResult {
  key: string;
  rows: Record<string, any | null>; // fileId -> row data
  diffs: Record<string, boolean>; // field -> hasDiff
  status: 'match' | 'mismatch' | 'missing' | 'extra';
}

export interface ComparisonGroup {
  id: string;
  name: string;
  selectedFileIds: string[];
  mappings: ColumnMapping[];
  keyFields: string[];
  diffFields: string[];
  results: DiffResult[];
  status: 'pending' | 'ready' | 'done';
}
