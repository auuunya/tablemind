import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileState } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Trash2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SheetSelectorProps {
  files: FileState[];
  onSheetSelect: (fileId: string, sheetName: string) => void;
  onRemoveFile: (fileId: string) => void;
}

export function SheetSelector({ files, onSheetSelect, onRemoveFile }: SheetSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {files.map((file) => (
        <Card key={file.id} className="overflow-hidden border-t-4" style={{ borderTopColor: file.color }}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium truncate pr-2 md:pr-4" title={file.name}>
              <div className="flex items-center gap-1.5 md:gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate max-w-[120px] md:max-w-[150px]">{file.name}</span>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-6 md:w-6 text-muted-foreground hover:text-destructive touch-target"
              onClick={() => onRemoveFile(file.id)}
            >
              <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">{t('sheetSelector.selectSheet')}</label>
                <Select
                  value={file.selectedSheet || ''}
                  onValueChange={(value) => onSheetSelect(file.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('columnMapper.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {file.sheets.map((sheet) => (
                      <SelectItem key={sheet} value={sheet}>
                        {sheet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {file.data ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {file.data.rows.length} {t('sheetSelector.rows')}
                    </span>
                  ) : (
                    <span>{t('sheetSelector.waitingSelection')}</span>
                  )}
                </div>

                {file.data && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Eye className="w-3 h-3 mr-1.5" />
                        {t('sheetSelector.preview')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] md:max-w-3xl max-h-[85vh] md:max-h-[80vh] p-4 md:p-6">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-primary" />
                          {file.name} - {file.selectedSheet}
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh] rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {file.data.headers.map((header, i) => (
                                <TableHead key={i} className="whitespace-nowrap bg-muted/50">
                                  {header}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {file.data.rows.slice(0, 50).map((row, i) => (
                              <TableRow key={i}>
                                {file.data?.headers.map((header, j) => (
                                  <TableCell key={j} className="whitespace-nowrap font-mono text-xs">
                                    {String(row[header] ?? '')}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
