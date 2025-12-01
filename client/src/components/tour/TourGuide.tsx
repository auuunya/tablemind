import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { getTourSteps, getTourStepsStep2, getTourStepsStep3, getTourStepsStep4 } from '@/lib/help-content';
import { Button } from '@/components/ui/button';
import { HelpCircle, X } from 'lucide-react';

/**
 * 新手引导组件
 * 使用 driver.js 提供交互式引导
 */
export function TourGuide() {
    const { t } = useTranslation();
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // 检查用户是否已经完成过引导
        const hasCompletedTour = localStorage.getItem('excel-tool-tour-completed');

        if (!hasCompletedTour) {
            // 延迟显示提示，让页面完全加载
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, []);

    const startTour = () => {
        setShowPrompt(false);

        const driverObj = driver({
            showProgress: true,
            steps: getTourSteps(t).map(step => ({
                element: step.target,
                popover: {
                    title: step.title,
                    description: step.content,
                    side: step.placement || 'bottom',
                    align: 'start'
                }
            })),
            onDestroyStarted: () => {
                // 用户完成或跳过引导
                localStorage.setItem('excel-tool-tour-completed', 'true');
                driverObj.destroy();
            },
            nextBtnText: t('buttons.next'),
            prevBtnText: t('buttons.previous'),
            doneBtnText: t('buttons.done'),
            progressText: '{{current}} / {{total}}',
            showButtons: ['next', 'previous', 'close'],
        });

        driverObj.drive();
    };

    const dismissPrompt = () => {
        setShowPrompt(false);
        localStorage.setItem('excel-tool-tour-completed', 'true');
    };

    // 显示引导提示对话框
    if (showPrompt) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
                <div className="bg-card border rounded-lg shadow-xl max-w-md p-6 mx-4 animate-in zoom-in-95 duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">{t('tourGuide.firstTime')}</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={dismissPrompt}
                            className="h-6 w-6 p-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <p className="text-muted-foreground mb-6">
                        {t('tourGuide.description')}
                    </p>

                    <div className="flex gap-3">
                        <Button onClick={startTour} className="flex-1">
                            {t('buttons.startGuide')}
                        </Button>
                        <Button variant="outline" onClick={dismissPrompt} className="flex-1">
                            {t('buttons.skip')}
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        {t('tourGuide.anytime')}
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

/**
 * 帮助按钮组件
 * 允许用户随时重新启动引导
 * 根据当前步骤显示相应的引导内容
 */
export function TourButton({ currentStep }: { currentStep?: number }) {
    const { t } = useTranslation();
    const startTour = () => {
        // 根据当前步骤选择合适的引导内容
        let stepsToUse: any[] = [];

        // 动态导入引导步骤
        import('@/lib/help-content').then(({ getTourSteps, getTourStepsStep2, getTourStepsStep3, getTourStepsStep4 }) => {
            if (currentStep === 2) {
                stepsToUse = getTourStepsStep2(t);
            } else if (currentStep === 3) {
                stepsToUse = getTourStepsStep3(t);
            } else if (currentStep === 4) {
                stepsToUse = getTourStepsStep4(t);
            } else {
                stepsToUse = getTourSteps(t);
            }

            if (stepsToUse.length === 0) {
                // 如果当前页面没有引导内容，提示用户
                alert(t('tourGuide.noGuidance'));
                return;
            }

            const driverObj = driver({
                showProgress: true,
                steps: stepsToUse.map(step => ({
                    element: step.target,
                    popover: {
                        title: step.title,
                        description: step.content,
                        side: step.placement || 'bottom',
                        align: 'start'
                    }
                })),
                onDestroyStarted: () => {
                    driverObj.destroy();
                },
                nextBtnText: t('buttons.next'),
                prevBtnText: t('buttons.previous'),
                doneBtnText: t('buttons.done'),
                progressText: '{{current}} / {{total}}',
                showButtons: ['next', 'previous', 'close'],
            });

            driverObj.drive();
        });
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={startTour}
            className="gap-2"
        >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">{t('buttons.userGuide')}</span>
        </Button>
    );
}
