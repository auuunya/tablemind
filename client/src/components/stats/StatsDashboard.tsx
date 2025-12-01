import { useTranslation } from 'react-i18next';
import React from 'react';
import { ComparisonGroup } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertTriangle, XCircle, FileText, BarChart3 } from 'lucide-react';

interface StatsDashboardProps {
    group: ComparisonGroup;
}

/**
 * 统计仪表板组件
 * 显示对比结果的关键指标和统计信息
 */
export function StatsDashboard({ group }: StatsDashboardProps) {
    const { t } = useTranslation();
    if (!group.results || group.results.length === 0) {
        return null;
    }

    const totalRows = group.results.length;
    const matchCount = group.results.filter(r => r.status === 'match').length;
    const mismatchCount = group.results.filter(r => r.status === 'mismatch').length;
    const missingCount = group.results.filter(r => r.status === 'missing').length;

    const matchPercentage = totalRows > 0 ? ((matchCount / totalRows) * 100).toFixed(1) : '0';
    const mismatchPercentage = totalRows > 0 ? ((mismatchCount / totalRows) * 100).toFixed(1) : '0';
    const missingPercentage = totalRows > 0 ? ((missingCount / totalRows) * 100).toFixed(1) : '0';

    // 计算各字段的差异数量
    const fieldDiffCounts: Record<string, number> = {};
    group.results.forEach(result => {
        group.diffFields.forEach(field => {
            if (result.diffs[field]) {
                fieldDiffCounts[field] = (fieldDiffCounts[field] || 0) + 1;
            }
        });
    });

    const stats = [
        {
            title: t('diffViewer.totalRecords'),
            value: totalRows,
            icon: FileText,
            color: 'text-slate-600',
            bgColor: 'bg-slate-100',
            description: t('stats.totalRowsDesc')
        },
        {
            title: t('diffViewer.fullyMatched'),
            value: matchCount,
            percentage: matchPercentage,
            icon: Check,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
            description: t('stats.matchDesc')
        },
        {
            title: t('diffViewer.hasDifferences'),
            value: mismatchCount,
            percentage: mismatchPercentage,
            icon: AlertTriangle,
            color: 'text-amber-600',
            bgColor: 'bg-amber-100',
            description: t('stats.mismatchDesc')
        },
        {
            title: t('diffViewer.dataMissing'),
            value: missingCount,
            percentage: missingPercentage,
            icon: XCircle,
            color: 'text-rose-600',
            bgColor: 'bg-rose-100',
            description: t('stats.missingDesc')
        }
    ];

    return (
        <div className="space-y-6">
            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">{stat.value.toLocaleString()}</span>
                                {stat.percentage && (
                                    <span className={`text-sm font-medium ${stat.color}`}>
                                        {stat.percentage}%
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 字段差异分布 */}
            {Object.keys(fieldDiffCounts).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            {t('stats.fieldDiffDistribution')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(fieldDiffCounts)
                                .sort(([, a], [, b]) => b - a)
                                .map(([field, count]) => {
                                    const percentage = ((count / totalRows) * 100).toFixed(1);
                                    return (
                                        <div key={field} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{field}</span>
                                                <span className="text-muted-foreground">
                                                    {count} {t('stats.records')} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 数据质量总结 */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('stats.qualitySummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
                            <div className="text-2xl font-bold text-emerald-600">{matchPercentage}%</div>
                            <div className="text-sm text-muted-foreground mt-1">{t('diffViewer.consistencyRate')}</div>
                        </div>
                        <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                            <div className="text-2xl font-bold text-amber-600">{mismatchPercentage}%</div>
                            <div className="text-sm text-muted-foreground mt-1">{t('stats.needsCheck')}</div>
                        </div>
                        <div className="text-center p-4 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900">
                            <div className="text-2xl font-bold text-rose-600">{missingPercentage}%</div>
                            <div className="text-sm text-muted-foreground mt-1">{t('diffViewer.dataMissing')}</div>
                        </div>
                    </div>

                    {matchPercentage === '100.0' ? (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                <Check className="w-5 h-5" />
                                <span className="font-medium">{t('stats.perfectMatch')}</span>
                            </div>
                        </div>
                    ) : mismatchCount > 0 || missingCount > 0 ? (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium">{t('stats.diffFound')}</span>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-7 list-disc">
                                {mismatchCount > 0 && (
                                    <li>{t('stats.checkMismatch', { count: mismatchCount })}</li>
                                )}
                                {missingCount > 0 && (
                                    <li>{t('stats.checkMissing', { count: missingCount })}</li>
                                )}
                                <li>{t('stats.exportTip')}</li>
                            </ul>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
