import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileState, ColumnMapping, ComparisonGroup } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Wand2, Settings, Edit2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ColumnMapperProps {
  files: FileState[];
  groups: ComparisonGroup[];
  onGroupsChange: (groups: ComparisonGroup[]) => void;
}

export function ColumnMapper({ files, groups, onGroupsChange }: ColumnMapperProps) {
  const { t } = useTranslation();
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const handleAddGroup = () => {
    const newGroup: ComparisonGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${t("columnMapper.group")} ${groups.length + 1}`,
      selectedFileIds: [],
      mappings: [],
      keyFields: [],
      diffFields: [],
      results: [],
      status: 'pending'
    };
    onGroupsChange([...groups, newGroup]);
  };

  const handleRemoveGroup = (groupId: string) => {
    onGroupsChange(groups.filter(g => g.id !== groupId));
  };

  const updateGroup = (groupId: string, updates: Partial<ComparisonGroup>) => {
    onGroupsChange(groups.map(g => (g.id === groupId ? { ...g, ...updates } : g)));
  };

  const startEditingName = (group: ComparisonGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(group.id);
    setEditNameValue(group.name);
  };

  const saveGroupName = (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editNameValue.trim()) {
      updateGroup(groupId, { name: editNameValue.trim() });
    }
    setEditingGroupId(null);
  };

  const toggleFileSelection = (groupId: string, fileId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    let newSelected = [...group.selectedFileIds];
    if (newSelected.includes(fileId)) {
      newSelected = newSelected.filter(id => id !== fileId);
    } else {
      newSelected.push(fileId);
    }
    updateGroup(groupId, { selectedFileIds: newSelected, mappings: [] }); // Reset mappings on file change for safety
  };

  const autoMap = (group: ComparisonGroup) => {
    const selectedFiles = files.filter(f => group.selectedFileIds.includes(f.id));
    if (selectedFiles.length === 0) return;

    const baseFile = selectedFiles[0];
    const newMappings: ColumnMapping[] = [];

    // Use base file's headers as a starting point
    if (baseFile.data) {
      baseFile.data.headers.forEach((header) => {
        const mapping: ColumnMapping = {
          targetField: header,
          sourceFields: { [baseFile.id]: header },
        };

        // Try to find matching headers in other files
        selectedFiles.slice(1).forEach((file) => {
          if (file.data?.headers.includes(header)) {
            mapping.sourceFields[file.id] = header;
          }
        });

        newMappings.push(mapping);
      });
    }
    updateGroup(group.id, { mappings: newMappings });
  };

  const addMapping = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    updateGroup(groupId, {
      mappings: [...group.mappings, { targetField: `Field ${group.mappings.length + 1}`, sourceFields: {} }]
    });
  };

  const removeMapping = (groupId: string, index: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const newMappings = [...group.mappings];
    newMappings.splice(index, 1);
    updateGroup(groupId, { mappings: newMappings });
  }

  const updateMapping = (groupId: string, index: number, field: keyof ColumnMapping, value: any) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const newMappings = [...group.mappings];
    if (field === 'targetField') {
      newMappings[index].targetField = value as string;
    } else if (field === 'sourceFields') {
      newMappings[index].sourceFields = value as Record<string, string>;
    }
    updateGroup(groupId, { mappings: newMappings });
  };

  const updateSourceField = (groupId: string, index: number, fileId: string, column: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const newMappings = [...group.mappings];
    newMappings[index].sourceFields = {
      ...newMappings[index].sourceFields,
      [fileId]: column
    };
    updateGroup(groupId, { mappings: newMappings });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAddGroup}>
          <Plus className="w-4 h-4 mr-2" />
          {t("columnMapper.addGroup")}
        </Button>
      </div>

      {groups.length === 0 && (
        <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
          点击上方按钮添加一个对比配置组
        </div>
      )}

      <Accordion type="multiple" defaultValue={groups.map(g => g.id)} className="space-y-4">
        {groups.map((group, groupIndex) => (
          <AccordionItem key={group.id} value={group.id} className="border rounded-lg bg-card">
            <AccordionTrigger className="px-4 hover:no-underline group/trigger">
              <div className="flex items-center gap-4 flex-1">
                {editingGroupId === group.id ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="h-7 w-[200px] text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveGroupName(group.id);
                        if (e.key === 'Escape') setEditingGroupId(null);
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={(e) => saveGroupName(group.id, e)}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/title">
                    <span className="font-semibold">{group.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover/title:opacity-100 transition-opacity"
                      onClick={(e) => startEditingName(group, e)}
                    >
                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  {t('stats.selectFieldFile', { count: group.selectedFileIds.length })}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2 space-y-6">
              {/* File Selection */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("columnMapper.step1")}</h4>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${group.id}-${file.id}`}
                        checked={group.selectedFileIds.includes(file.id)}
                        onCheckedChange={() => toggleFileSelection(group.id, file.id)}
                      />
                      <Label htmlFor={`${group.id}-${file.id}`} className="flex items-center gap-2 cursor-pointer">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: file.color }} />
                        {file.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapping Table */}
              {group.selectedFileIds.length >= 2 ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h4 className="text-sm font-medium">{t("columnMapper.step2")}</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => autoMap(group)}>
                        <Wand2 className="w-4 h-4 mr-2" /> {t("buttons.autoMatch")}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => addMapping(group.id)}>
                        <Plus className="w-4 h-4 mr-2" /> {t("buttons.addField")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> {t("buttons.deleteGroup")}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border overflow-x-auto data-scrollbar">
                    <div className="text-xs text-muted-foreground mb-2 md:hidden px-2">
                      {t('columnMapper.swipeHint')}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 z-10 bg-muted/50 shadow-[2px_0_4px_rgba(0,0,0,0.05)] min-w-[140px] md:min-w-[180px] max-w-[140px] md:max-w-[200px]">{t("columnMapper.unifiedFieldName")}</TableHead>
                          {group.selectedFileIds.map(fileId => {
                            const file = files.find(f => f.id === fileId);
                            return (
                              <TableHead key={fileId} className="min-w-[140px] md:min-w-[180px] bg-muted/50">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: file?.color }} />
                                  <span className="truncate max-w-[100px] md:max-w-[140px] text-xs md:text-sm" title={file?.name}>{file?.name}</span>
                                </div>
                              </TableHead>
                            );
                          })}
                          <TableHead className="w-[44px] md:w-[50px] bg-muted/50"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.mappings.map((mapping, index) => (
                          <TableRow key={index}>
                            <TableCell className="sticky left-0 z-10 bg-card shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                              <Input
                                value={mapping.targetField}
                                onChange={(e) => updateMapping(group.id, index, 'targetField', e.target.value)}
                                className="h-8 md:h-9 text-xs md:text-sm min-w-[120px] md:min-w-[160px]"
                              />
                            </TableCell>
                            {group.selectedFileIds.map(fileId => {
                              const file = files.find(f => f.id === fileId);
                              return (
                                <TableCell key={fileId}>
                                  <Select
                                    value={mapping.sourceFields[fileId] || ''}
                                    onValueChange={(val) => updateSourceField(group.id, index, fileId, val)}
                                  >
                                    <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm w-full min-w-[120px] md:min-w-[160px]">
                                      <SelectValue placeholder={t("columnMapper.selectPlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {file?.data?.headers.map(h => (
                                        <SelectItem key={h} value={h} className="text-xs md:text-sm">{h}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-destructive touch-target"
                                onClick={() => removeMapping(group.id, index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {group.mappings.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={group.selectedFileIds.length + 2} className="text-center text-muted-foreground py-8">
                              {t('columnMapper.noMappings')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {t('columnMapper.minFilesWarning')}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
