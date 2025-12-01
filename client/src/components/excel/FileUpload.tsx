import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile, UserFriendlyError } from '@/lib/error-handler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export function FileUpload({ onFilesSelected, className }: FileUploadProps) {
  const { t } = useTranslation();
  const [validationError, setValidationError] = useState<UserFriendlyError | null>(null);
  const { toast } = useToast();

  const validateAndProcess = (files: File[]) => {
    setValidationError(null);

    // 验证所有文件
    const validatedFiles: File[] = [];

    for (const file of files) {
      const validation = validateFile(file);

      if (!validation.valid && validation.error) {
        // 如果是警告(文件大)仍然允许继续
        if (validation.error.severity === 'warning') {
          toast({
            title: validation.error.title,
            description: validation.error.message,
            variant: 'default',
          });
          validatedFiles.push(file);
        } else {
          // 错误则阻止
          setValidationError(validation.error);
          toast({
            title: validation.error.title,
            description: validation.error.message,
            variant: 'destructive',
          });
          return; // 停止处理
        }
      } else {
        validatedFiles.push(file);
      }
    }

    if (validatedFiles.length > 0) {
      onFilesSelected(validatedFiles);
      setValidationError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    validateAndProcess(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      validateAndProcess(files);
      // 重置input以允许重新上传同一文件
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-12 text-center transition-all duration-200 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 group cursor-pointer relative",
          className
        )}
      >
        <input
          type="file"
          multiple
          accept=".xlsx,.xls"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full group-hover:scale-110 transition-transform duration-200">
            <Upload className="w-6 h-6 md:w-8 md:h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('fileUpload.title')}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 px-2">
              {t('fileUpload.description')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {t('fileUpload.privacyNotice')}
            </p>
          </div>
        </div>
      </div>

      {validationError && (
        <Alert variant="destructive" className="animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{validationError.title}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{validationError.message}</p>
            {validationError.suggestions.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-sm mb-1">{t('errors.suggestions')}</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {validationError.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
