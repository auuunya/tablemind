import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileState, ComparisonGroup } from '@/lib/types';
import { readExcelFile, getSheetData, generateDiff } from '@/lib/excel';
import { FileUpload } from '@/components/excel/FileUpload';
import { SheetSelector } from '@/components/excel/SheetSelector';
import { ColumnMapper } from '@/components/excel/ColumnMapper';
import { DiffViewer } from '@/components/excel/DiffViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, ArrowRight, Settings2, Database, FileSpreadsheet, BarChart3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpPanel } from '@/components/help/HelpPanel';
import { TourButton } from '@/components/tour/TourGuide';
import { getDemoInitialState } from '@/lib/demo-data';
import { Home, Github } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

export function ExcelDiffTool() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<FileState[]>([]);
  const [groups, setGroups] = useState<ComparisonGroup[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 启动演示模式
  const startDemoMode = () => {
    const demoState = getDemoInitialState();
    console.log("demoState:", demoState)
    setFiles(demoState.files as any);
    setGroups(demoState.groups as any);
    // setStep(1); // 跳到对比组页面
    setIsDemoMode(true);
  };

  // 重置到首页
  const resetToHome = () => {
    setStep(1);
    setFiles([]);
    setGroups([]);
    setIsDemoMode(false);
  };

  // Handlers
  const handleFilesSelected = async (newFiles: File[]) => {
    const processedFiles: FileState[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      try {
        const { sheets, workbook } = await readExcelFile(file);
        processedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          sheets,
          selectedSheet: sheets[0], // Default to first sheet
          data: getSheetData(workbook, sheets[0]),
          color: COLORS[(files.length + i) % COLORS.length]
        });
      } catch (err) {
        console.error("Error reading file", err);
      }
    }

    setFiles([...files, ...processedFiles]);
  };

  const handleSheetChange = async (fileId: string, sheetName: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const file = files[fileIndex];
    const { workbook } = await readExcelFile(file.file);
    const newData = getSheetData(workbook, sheetName);

    const newFiles = [...files];
    newFiles[fileIndex] = {
      ...file,
      selectedSheet: sheetName,
      data: newData
    };
    setFiles(newFiles);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    // Also remove from groups
    setGroups(groups.map(g => ({
      ...g,
      selectedFileIds: g.selectedFileIds.filter(fid => fid !== id)
    })));
  };

  const handleCompare = () => {
    const updatedGroups = groups.map(group => {
      const groupFiles = files.filter(f => group.selectedFileIds.includes(f.id));
      const res = generateDiff(groupFiles, group.mappings, group.keyFields, group.diffFields);
      return { ...group, results: res, status: 'done' as const };
    });
    setGroups(updatedGroups);
    setStep(4);
  };

  const updateGroup = (groupId: string, updates: Partial<ComparisonGroup>) => {
    setGroups(groups.map(g => (g.id === groupId ? { ...g, ...updates } : g)));
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  }

  const steps = [
    { num: 1, title: t('steps.uploadFiles'), icon: FileSpreadsheet },
    { num: 2, title: t('steps.createGroups'), icon: Database },
    { num: 3, title: t('steps.configure'), icon: Settings2 },
    { num: 4, title: t('steps.results'), icon: BarChart3 },
  ];

  return (
    <div className="container mx-auto py-4 md:py-8 max-w-7xl px-3 md:px-4 space-y-4 md:space-y-8">
      <div className="flex flex-col gap-4">
        <button
          onClick={resetToHome}
          className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity group w-full md:w-auto"
        >
          <img src="/logo.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
          <div className="min-w-0 text-left">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              {t('app.title')}
              <span className="text-xs md:text-sm lg:text-base font-normal text-slate-500">{t('app.subtitle')}</span>
            </h1>
            <p className="text-slate-500 mt-0.5 text-xs md:text-sm hidden sm:block">{t('app.description')}</p>
          </div>
        </button>

        <div className="flex flex-nowrap sm:flex-wrap gap-2 w-full justify-end overflow-x-auto">
          {step === 1 && files.length === 0 && (
            <Button
              variant="outline"
              onClick={startDemoMode}
              className="gap-2 border-primary/50 text-primary hover:bg-primary/10 sm:w-auto shrink-0"
              size="sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('buttons.tryDemo')}</span>
              <span className="sm:hidden">{t('buttons.demo')}</span>
            </Button>
          )}

          <div className="sm:w-auto shrink-0">
            <LanguageSwitcher />
          </div>

          <TourButton currentStep={step} />
          <HelpPanel />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('https://github.com/auuunya', '_blank')}
            title="GitHub"
          >
            <Github className="w-5 h-5" />
          </Button>
        </div>


        {/* Stepper */}
        <div className="flex items-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
          {steps.map((s) => (
            <div
              key={s.num}
              className={cn(
                "flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                step === s.num
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : step > s.num
                    ? "text-slate-500 hover:text-slate-700"
                    : "text-slate-400"
              )}
            >
              <div className={cn(
                "w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs border flex-shrink-0",
                step === s.num ? "border-primary text-primary" : step > s.num ? "bg-primary text-white border-primary" : "border-slate-300"
              )}>
                {step > s.num ? <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="min-h-[600px]">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-tour="file-upload">
            <FileUpload onFilesSelected={handleFilesSelected} />

            {files.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t('fileUpload.filesUploaded')} ({files.length})</h3>
                  <Button onClick={() => setStep(2)} disabled={files.length < 2}>
                    {t('fileUpload.nextStep')} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div data-tour="sheet-selector">
                  <SheetSelector
                    files={files}
                    onSheetSelect={handleSheetChange}
                    onRemoveFile={handleRemoveFile}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end mb-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>{t('buttons.previous')}</Button>
                <Button onClick={() => setStep(3)} disabled={groups.length === 0 || groups.some(g => g.mappings.length === 0)}>
                  {t('buttons.next')}: {t('steps.configure')} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
            <div data-tour="column-mapper">
              <ColumnMapper
                files={files}
                groups={groups}
                onGroupsChange={setGroups}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {groups.map((group, idx) => (
              <Card key={group.id} className="border-l-4" style={{ borderLeftColor: COLORS[idx % COLORS.length] }}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      {t('compareConfig.title')} ({group.mappings.length} {t('compareConfig.fieldsCount')})
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeGroup(group.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3" data-tour="key-fields">
                    <Label>{t('compareConfig.primaryKey')}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      {group.mappings.map(m => (
                        <div
                          key={m.targetField}
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-md transition-colors border",
                            group.keyFields.includes(m.targetField)
                              ? "bg-primary/10 border-primary/30"
                              : "bg-white dark:bg-slate-950 border-transparent hover:border-slate-200"
                          )}
                        >
                          <Checkbox
                            id={`key-${group.id}-${m.targetField}`}
                            checked={group.keyFields.includes(m.targetField)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const newKeys = [...group.keyFields, m.targetField];
                                const newDiffs = group.diffFields.filter(f => f !== m.targetField);
                                updateGroup(group.id, { keyFields: newKeys, diffFields: newDiffs });
                              } else {
                                const newKeys = group.keyFields.filter(f => f !== m.targetField);
                                updateGroup(group.id, { keyFields: newKeys });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`key-${group.id}-${m.targetField}`}
                            className="text-sm font-medium cursor-pointer flex-1 truncate"
                          >
                            {m.targetField}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3" data-tour="diff-fields">
                    <Label>{t('compareConfig.compareFields')}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border rounded-lg p-4">
                      {group.mappings.filter(m => !group.keyFields.includes(m.targetField)).map(m => (
                        <div key={m.targetField} className="flex items-center space-x-2 p-2">
                          <Checkbox
                            id={`diff-${group.id}-${m.targetField}`}
                            checked={group.diffFields.includes(m.targetField)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateGroup(group.id, { diffFields: [...group.diffFields, m.targetField] });
                              } else {
                                updateGroup(group.id, { diffFields: group.diffFields.filter(f => f !== m.targetField) });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`diff-${group.id}-${m.targetField}`}
                            className="text-sm font-normal cursor-pointer truncate"
                          >
                            {m.targetField}
                          </Label>
                        </div>
                      ))}
                      {group.mappings.filter(m => !group.keyFields.includes(m.targetField)).length === 0 && (
                        <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                          {t('compareConfig.noFieldsAvailable')}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}


            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>{t('buttons.previous')}</Button>
              <Button
                data-tour="compare-button"
                onClick={handleCompare}
                disabled={groups.length === 0 || groups.some(g => g.keyFields.length === 0 || g.diffFields.length === 0)}
                size="lg"
                className="px-8"
              >
                {t('buttons.startComparison')} <BarChart3 className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-tour="results">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setStep(3)}>
                <Settings2 className="w-4 h-4 mr-2" /> {t('buttons.adjustConfig')}
              </Button>
              <Button variant="outline" onClick={resetToHome}>
                <Home className="w-4 h-4 mr-2" />
                {t('buttons.startNew')}
              </Button>
            </div>

            <Tabs defaultValue={groups[0]?.id}>
              <TabsList>
                {groups.map(g => (
                  <TabsTrigger key={g.id} value={g.id}>{g.name}</TabsTrigger>
                ))}
              </TabsList>
              {groups.map(g => (
                <TabsContent key={g.id} value={g.id}>
                  <DiffViewer group={g} files={files} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
