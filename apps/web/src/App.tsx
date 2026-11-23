import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { KpiGridSkeleton } from './components/ui/Skeleton';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Route-level code splitting for fast initial bundle load
const OverviewPage = lazy(() =>
  import('./pages/OverviewPage').then((m) => ({ default: m.OverviewPage }))
);
const TrendsPage = lazy(() =>
  import('./pages/TrendsPage').then((m) => ({ default: m.TrendsPage }))
);
const DistributionPage = lazy(() =>
  import('./pages/DistributionPage').then((m) => ({ default: m.DistributionPage }))
);
const TopicsPage = lazy(() =>
  import('./pages/TopicsPage').then((m) => ({ default: m.TopicsPage }))
);
const ReviewsExplorerPage = lazy(() =>
  import('./pages/ReviewsExplorerPage').then((m) => ({
    default: m.ReviewsExplorerPage,
  }))
);
const ComparisonPage = lazy(() =>
  import('./pages/ComparisonPage').then((m) => ({ default: m.ComparisonPage }))
);
const FlaggedReviewsPage = lazy(() =>
  import('./pages/FlaggedReviewsPage').then((m) => ({
    default: m.FlaggedReviewsPage,
  }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

export function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <FilterProvider>
              <AppShell>
                <Suspense fallback={<KpiGridSkeleton count={4} />}>
                  <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/trends" element={<TrendsPage />} />
                    <Route path="/distribution" element={<DistributionPage />} />
                    <Route path="/topics" element={<TopicsPage />} />
                    <Route path="/reviews" element={<ReviewsExplorerPage />} />
                    <Route path="/comparison" element={<ComparisonPage />} />
                    <Route path="/flagged" element={<FlaggedReviewsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </AppShell>
            </FilterProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
