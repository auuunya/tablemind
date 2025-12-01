import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ExcelDiffTool } from "@/pages/ExcelDiffTool";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TourGuide } from "@/components/tour/TourGuide";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

function TitleUpdater() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const updateTitle = () => {
      document.title = t('app.title');
    };

    // 初始化 title
    updateTitle();

    // 监听语言变化
    i18n.on('languageChanged', updateTitle);

    return () => {
      i18n.off('languageChanged', updateTitle);
    };
  }, [t, i18n]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ExcelDiffTool} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <TourGuide />
          <TitleUpdater />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
