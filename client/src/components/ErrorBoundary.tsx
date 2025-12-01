import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Translation } from 'react-i18next';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件
 * 捕获应用中的JavaScript错误并显示友好的错误页面
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // 记录错误到控制台
        console.error('错误边界捕获到错误:', error, errorInfo);

        // 可以在这里集成错误日志服务
        // logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        // 清除错误状态
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        // 重新加载页面
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Translation>
                    {(t) => (
                        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
                            <Card className="max-w-2xl w-full shadow-xl">
                                <CardHeader className="text-center pb-4">
                                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle className="w-8 h-8 text-destructive" />
                                    </div>
                                    <CardTitle className="text-2xl">{t('errors.somethingWentWrong')}</CardTitle>
                                    <CardDescription className="text-base mt-2">
                                        {t('errors.unexpectedError')}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                        <h4 className="font-medium text-sm">{t('errors.possibleCauses')}:</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                            <li>{t('errors.cause1')}</li>
                                            <li>{t('errors.cause2')}</li>
                                            <li>{t('errors.cause3')}</li>
                                            <li>{t('errors.cause4')}</li>
                                        </ul>
                                    </div>

                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <span className="text-lg">💡</span>
                                            {t('errors.suggestions')}
                                        </h4>
                                        <ol className="text-sm text-muted-foreground space-y-1 pl-7 list-decimal">
                                            <li>{t('errors.suggestion1')}</li>
                                            <li>{t('errors.suggestion2')}</li>
                                            <li>{t('errors.suggestion3')}</li>
                                            <li>{t('errors.suggestion4')}</li>
                                            <li>{t('errors.suggestion5')}</li>
                                        </ol>
                                    </div>

                                    {process.env.NODE_ENV === 'development' && this.state.error && (
                                        <details className="text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded border">
                                            <summary className="cursor-pointer font-medium mb-2">Technical Details (Dev Mode)</summary>
                                            <pre className="overflow-auto text-xs text-destructive whitespace-pre-wrap">
                                                {this.state.error.toString()}
                                                {this.state.errorInfo?.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </CardContent>

                                <CardFooter className="flex gap-3 pt-4">
                                    <Button
                                        onClick={this.handleReset}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        {t('common.restart')}
                                    </Button>
                                    <Button
                                        onClick={this.handleReload}
                                        className="flex-1"
                                    >
                                        <Home className="w-4 h-4 mr-2" />
                                        {t('common.refresh')}
                                    </Button>
                                </CardFooter>

                                <div className="px-6 pb-6 text-center">
                                    <p className="text-xs text-muted-foreground">
                                        {t('errors.needHelp')} {' '}
                                        <a href="mailto:zyy.im@outlook.com" className="text-primary hover:underline">
                                            zyy.im@outlook.com
                                        </a>
                                    </p>
                                </div>
                            </Card>
                        </div>
                    )}
                </Translation>
            );
        }

        return this.props.children;
    }
}
