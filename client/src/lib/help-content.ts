import { TFunction } from 'i18next';

/**
 * 应用内帮助内容
 * 为非技术用户提供清晰、通俗的操作指南
 */

export interface HelpSection {
    id: string;
    title: string;
    content: string;
    category: 'getting-started' | 'features' | 'troubleshooting' | 'faq';
}

export interface TourStep {
    target: string;
    content: string;
    title: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    popover?: {
        onPopoverRender?: () => void;
    };
}

// 新手引导步骤 - 简化版，只在当前页面引导
export const getTourSteps = (t: TFunction): TourStep[] => [
    {
        target: 'body',
        content: t('tourGuide.welcomeDesc'),
        title: t('tourGuide.welcome'),
        placement: 'bottom'
    },
    {
        target: '[data-tour="file-upload"]',
        content: t('tourGuide.step1Desc'),
        title: t('tourGuide.step1Title'),
        placement: 'bottom'
    }
];

// 步骤2的引导：对比组配置
export const getTourStepsStep2 = (t: TFunction): TourStep[] => [
    {
        target: '[data-tour="column-mapper"]',
        content: t('tourGuide.step2Desc'),
        title: t('tourGuide.step2Title'),
        placement: 'top'
    }
];

// 步骤3的引导：设置对比规则
export const getTourStepsStep3 = (t: TFunction): TourStep[] => [
    {
        target: '[data-tour="key-fields"]',
        content: t('tourGuide.step3KeyDesc'),
        title: t('tourGuide.step3KeyTitle'),
        placement: 'top'
    },
    {
        target: '[data-tour="diff-fields"]',
        content: t('tourGuide.step3FieldDesc'),
        title: t('tourGuide.step3FieldTitle'),
        placement: 'top'
    },
    {
        target: '[data-tour="compare-button"]',
        content: t('tourGuide.step3CompareDesc'),
        title: t('tourGuide.step3CompareTitle'),
        placement: 'left'
    }
];

// 步骤4的引导：查看结果
export const getTourStepsStep4 = (t: TFunction): TourStep[] => [
    {
        target: '[data-tour="results"]',
        content: t('tourGuide.step4Desc'),
        title: t('tourGuide.step4Title'),
        placement: 'top'
    },
    {
        target: '[data-tour="export"]',
        content: t('tourGuide.step4ExportDesc'),
        title: t('tourGuide.step4ExportTitle'),
        placement: 'left'
    }
];

// 帮助文档内容
export const getHelpSections = (t: TFunction): HelpSection[] => [
    // 快速开始
    {
        id: 'what-is-this',
        title: t('help.whatIsThis'),
        content: t('help.whatIsThisContent'),
        category: 'getting-started'
    },
    {
        id: 'quick-start',
        title: t('help.quickStart'),
        content: t('help.quickStartContent'),
        category: 'getting-started'
    },
    {
        id: 'data-privacy',
        title: t('help.dataPrivacy'),
        content: t('help.dataPrivacyContent'),
        category: 'getting-started'
    },

    // 功能说明
    {
        id: 'column-mapping',
        title: t('help.columnMapping'),
        content: t('help.columnMappingContent'),
        category: 'features'
    },
    {
        id: 'key-fields',
        title: t('help.keyFields'),
        content: t('help.keyFieldsContent'),
        category: 'features'
    },
    {
        id: 'diff-status',
        title: t('help.diffStatus'),
        content: t('help.diffStatusContent'),
        category: 'features'
    },
    {
        id: 'export-options',
        title: t('help.exportOptions'),
        content: t('help.exportOptionsContent'),
        category: 'features'
    },

    // 常见问题
    {
        id: 'file-size-limit',
        title: t('help.fileSize'),
        content: t('help.fileSizeContent'),
        category: 'faq'
    },
    {
        id: 'supported-formats',
        title: t('help.supportedFormats'),
        content: t('help.supportedFormatsContent'),
        category: 'faq'
    },
    {
        id: 'multiple-sheets',
        title: t('help.multipleSheets'),
        content: t('help.multipleSheetsContent'),
        category: 'faq'
    },

    // 疑难解答
    {
        id: 'no-matches-found',
        title: t('help.noMatches'),
        content: t('help.noMatchesContent'),
        category: 'troubleshooting'
    },
    {
        id: 'wrong-results',
        title: t('help.wrongResults'),
        content: t('help.wrongResultsContent'),
        category: 'troubleshooting'
    },
    {
        id: 'browser-slow',
        title: t('help.browserSlow'),
        content: t('help.browserSlowContent'),
        category: 'troubleshooting'
    }
];

// 术语表
export const getGlossary = (t: TFunction): Record<string, string> => ({
    [t('glossary.uniqueKey')]: t('glossary.uniqueKeyDesc'),
    [t('glossary.columnMapping')]: t('glossary.columnMappingDesc'),
    [t('glossary.compareFields')]: t('glossary.compareFieldsDesc'),
    [t('glossary.compareGroup')]: t('glossary.compareGroupDesc'),
    [t('glossary.worksheet')]: t('glossary.worksheetDesc'),
    [t('glossary.difference')]: t('glossary.differenceDesc'),
    [t('glossary.missing')]: t('glossary.missingDesc')
});
