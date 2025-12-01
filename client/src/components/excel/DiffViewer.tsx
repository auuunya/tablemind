import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { FileState, DiffResult, ColumnMapping, ComparisonGroup } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, AlertTriangle, XCircle, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExcelJS from 'exceljs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatsDashboard } from '@/components/stats/StatsDashboard';

interface DiffViewerProps {
  group: ComparisonGroup;
  files: FileState[];
}

export function DiffViewer({ group, files }: DiffViewerProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'mismatch' | 'missing'>('all');
  const [hideStatusColumn, setHideStatusColumn] = useState(false);

  const filteredResults = group.results.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'mismatch') return r.status === 'mismatch';
    if (filter === 'missing') return r.status === 'missing';
    return true;
  });

  const getMappedValue = (fileId: string, row: any, targetField: string) => {
    const mapping = group.mappings.find(m => m.targetField === targetField);
    if (!mapping) return undefined;
    const sourceCol = mapping.sourceFields[fileId];
    if (!sourceCol) return undefined;
    return row[sourceCol];
  };

  const exportToExcel = async () => {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(t('diffViewer.export'));

    // Prepare column headers
    const headers: string[] = [];
    if (!hideStatusColumn) {
      headers.push(t('diffViewer.status'));
    }

    // Add all mapped columns
    group.mappings.forEach(m => {
      headers.push(m.targetField);
    });

    // Add diff detail columns
    group.diffFields.forEach(field => {
      group.selectedFileIds.forEach(fid => {
        const f = files.find(file => file.id === fid);
        if (f) {
          headers.push(`${t('diffViewer.details')}: ${field} (${f.name})`);
        }
      });
    });

    // Add header row
    const headerRow = worksheet.addRow(headers);

    // Style header row
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FF1F2937' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'medium', color: { argb: 'FF9CA3AF' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    });

    // Define status colors
    const statusColors = {
      match: 'FFD4EDDA',      // Light green
      mismatch: 'FFFFF3CD',   // Light yellow  
      missing: 'FFF8D7DA'     // Light red
    };

    // Add data rows
    const filteredData = hideStatusColumn
      ? group.results
      : group.results;

    filteredData.forEach(result => {
      const rowData: any[] = [];

      // Add status column
      if (!hideStatusColumn) {
        rowData.push(
          result.status === 'match' ? t('diffViewer.matched') :
            result.status === 'mismatch' ? t('diffViewer.difference') : t('diffViewer.missing')
        );
      }

      // Add mapped columns
      group.mappings.forEach(m => {
        const firstFileId = group.selectedFileIds.find(fid => result.rows[fid]);
        const val = firstFileId ? getMappedValue(firstFileId, result.rows[firstFileId], m.targetField) : '';
        rowData.push(val);
      });

      // Add diff detail columns
      group.diffFields.forEach(field => {
        group.selectedFileIds.forEach(fid => {
          const f = files.find(file => file.id === fid);
          if (f) {
            const val = result.rows[fid] ? getMappedValue(fid, result.rows[fid], field) : `(${t('diffViewer.missing')})`;
            rowData.push(val);
          }
        });
      });

      const dataRow = worksheet.addRow(rowData);

      // Apply row styling based on status
      const bgColor = statusColors[result.status as keyof typeof statusColors];
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      });
    });

    // Auto-size columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = 12;
      if (column && column.eachCell) {
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
      }
      if (column) {
        column.width = Math.min(maxLength + 2, 50); // Max 50 characters width
      }
    });

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${t('diffViewer.export')}_${group.name}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper to get value for display in the main table (Base value)
  const getDisplayValue = (result: DiffResult, field: string) => {
    // Find the first file that has this row
    const firstFileId = group.selectedFileIds.find(fid => result.rows[fid]);
    if (!firstFileId) return '';
    return getMappedValue(firstFileId, result.rows[firstFileId], field);
  };

  return (
    <div className="space-y-4">
      {/* 统计仪表板 */}
      <StatsDashboard group={group} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
              className="text-xs md:text-sm"
            >
              {t('diffViewer.all')} ({group.results.length})
            </Button>
            <Button
              variant={filter === 'mismatch' ? 'destructive' : 'outline'}
              onClick={() => setFilter('mismatch')}
              size="sm"
              className={cn(filter === 'mismatch' && "bg-amber-500 hover:bg-amber-600 border-amber-500", "text-xs md:text-sm")}
            >
              {t('diffViewer.differences')} ({group.results.filter(r => r.status === 'mismatch').length})
            </Button>
            <Button
              variant={filter === 'missing' ? 'destructive' : 'outline'}
              onClick={() => setFilter('missing')}
              size="sm"
              className="text-xs md:text-sm"
            >
              {t('diffViewer.missing')} ({group.results.filter(r => r.status === 'missing').length})
            </Button>
          </div>
          <div className="flex items-center space-x-2 border-l pl-3 md:pl-4">
            <Switch id="hide-status" checked={hideStatusColumn} onCheckedChange={setHideStatusColumn} />
            <Label htmlFor="hide-status" className="text-xs md:text-sm">{t('diffViewer.includeStatus')}</Label>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 w-full md:w-auto">
          {/* Color Legend */}
          <div className="flex items-center gap-2 md:gap-3 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></div>
              <span>{t('diffViewer.matched')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200"></div>
              <span>{t('diffViewer.differences')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-rose-50 border border-rose-200"></div>
              <span>{t('diffViewer.missing')}</span>
            </div>
          </div>
          <Button onClick={exportToExcel} variant="secondary" data-tour="export" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            {t('diffViewer.export')}
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <ScrollArea className="h-[400px] md:h-[600px] w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[100px] min-w-[100px] bg-card border-b shadow-sm z-20">{t('diffViewer.status')}</TableHead>
                {/* All Mapped Columns */}
                {group.mappings.map(m => (
                  <TableHead key={m.targetField} className={cn("min-w-[150px] whitespace-nowrap bg-card border-b", group.keyFields.includes(m.targetField) && "font-bold border-l border-r bg-muted/20")}>
                    {m.targetField}
                    {group.keyFields.includes(m.targetField) && <span className="ml-1 text-xs text-muted-foreground">(Primary Key)</span>}
                  </TableHead>
                ))}
                {/* Diff Detail Columns (Dynamically added at the end) */}
                {group.diffFields.map(field => (
                  <TableHead key={`diff-${field}`} className="min-w-[300px] bg-amber-50/50 text-amber-900 border-l-2 border-amber-100 border-b">
                    {t('compareConfig.diffDetail')}: {field}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result, idx) => {
                // Define row background color based on status
                const rowBgClass = result.status === 'match'
                  ? 'bg-emerald-50/30 hover:bg-emerald-50/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30'
                  : result.status === 'mismatch'
                    ? 'bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30'
                    : 'bg-rose-50/30 hover:bg-rose-50/50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30';

                return (
                  <TableRow key={idx} className={cn(rowBgClass, "transition-colors")}>
                    <TableCell className={cn(
                      "sticky left-0 backdrop-blur-sm shadow-[1px_0_0_0_var(--border)] border-b",
                      result.status === 'match' && 'bg-emerald-50/50 dark:bg-emerald-950/30',
                      result.status === 'mismatch' && 'bg-amber-50/50 dark:bg-amber-950/30',
                      result.status === 'missing' && 'bg-rose-50/50 dark:bg-rose-950/30'
                    )}>
                      {result.status === 'match' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap"><Check className="w-3 h-3 mr-1" /> 匹配</Badge>}
                      {result.status === 'mismatch' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap"><AlertTriangle className="w-3 h-3 mr-1" /> 差异</Badge>}
                      {result.status === 'missing' && <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 whitespace-nowrap"><XCircle className="w-3 h-3 mr-1" /> 缺失</Badge>}
                    </TableCell>

                    {/* Standard Data Columns (Base Value) */}
                    {group.mappings.map(m => (
                      <TableCell key={m.targetField} className={cn("whitespace-nowrap border-b", group.keyFields.includes(m.targetField) && "font-mono font-medium bg-muted/10")}>
                        {String(getDisplayValue(result, m.targetField) ?? '')}
                      </TableCell>
                    ))}

                    {/* Diff Detail Columns */}
                    {group.diffFields.map(field => (
                      <TableCell key={`diff-${field}`} className="bg-amber-50/30 border-l-2 border-amber-100 border-b">
                        {result.diffs[field] ? (
                          <div className="flex flex-col gap-1 text-xs">
                            {group.selectedFileIds.map(fid => {
                              const file = files.find(f => f.id === fid);
                              if (!file) return null;
                              const hasRow = !!result.rows[fid];
                              const val = hasRow ? getMappedValue(fid, result.rows[fid], field) : null;
                              return (
                                <div key={fid} className="flex items-center gap-2 p-1 rounded bg-white/80 border border-transparent hover:border-amber-200">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: file.color }} />
                                  <span className="text-muted-foreground w-[60px] truncate shrink-0">{file.name}:</span>
                                  <span className={cn("font-mono font-medium break-all", !hasRow && "text-rose-500 italic")}>
                                    {hasRow ? String(val ?? '') : "(缺失)"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">{t('diffViewer.emptyState')}</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
