import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Command,
  Compass,
  Flag,
  GitCompare,
  Hotel,
  LayoutDashboard,
  Menu,
  Moon,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useGlobalFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { DatePreset } from '../../types/api';
import { ImportModal } from '../import/ImportModal';
import { CommandPalette } from '../ui/CommandPalette';
import { ColdStartBanner } from '../ui/StateViews';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/trends', label: 'Trends & Volume', icon: TrendingUp },
  { to: '/distribution', label: 'Distributions', icon: BarChart3 },
  { to: '/topics', label: 'Topic Insights', icon: Sparkles },
  { to: '/reviews', label: 'Reviews Explorer', icon: Compass },
  { to: '/comparison', label: 'Property Comparison', icon: GitCompare },
  { to: '/flagged', label: 'Flagged Queue', icon: Flag, showBadge: true },
];

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Executive Overview',
    subtitle: 'Portfolio KPIs, sentiment distribution, and property performance cards',
  },
  '/trends': {
    title: 'Score & Volume Trends',
    subtitle: 'Longitudinal guest satisfaction trajectory and review velocity',
  },
  '/distribution': {
    title: 'Guest & Score Distributions',
    subtitle: 'Score histogram (1–10), trip-type segmentation, and origin markets',
  },
  '/topics': {
    title: 'Topic Sentiment Intelligence',
    subtitle: 'Rule-based keyword & clause polarity analysis across 8 hospitality dimensions',
  },
  '/reviews': {
    title: 'Reviews Explorer',
    subtitle: 'Full-text trigram search, multi-facet filtering, inspection, and CSV export',
  },
  '/comparison': {
    title: 'Property Comparison',
    subtitle: 'Side-by-side benchmarking across KPIs and topic satisfaction radar',
  },
  '/flagged': {
    title: 'Flagged Reviews Action Queue',
    subtitle: 'Low-scoring operational reviews requiring management follow-up',
  },
};

const DATE_PRESET_OPTIONS: Array<{ value: DatePreset; label: string }> = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '12m', label: '12m' },
  { value: 'all', label: 'All (18m)' },
];

export function AppShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showCustomDates, setShowCustomDates] = useState(false);

  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const {
    propertyId,
    preset,
    from,
    to,
    setPropertyId,
    setPreset,
    setCustomDateRange,
  } = useGlobalFilters();

  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.getProperties(),
    staleTime: 5 * 60 * 1000,
  });

  const overviewBadgeQuery = useQuery({
    queryKey: ['overview-badge', propertyId],
    queryFn: () => api.getOverview({ propertyId, preset: 'all' }),
    staleTime: 60 * 1000,
  });

  const properties = propertiesQuery.data ?? [];
  const unresolvedFlaggedCount =
    overviewBadgeQuery.data?.summary.unresolvedFlaggedCount ?? 0;

  const currentRouteMeta = ROUTE_TITLES[location.pathname] ?? {
    title: 'Review Insights',
    subtitle: 'Multi-property hospitality analytics',
  };

  const selectedPropertyObj = properties.find(
    (p) => p.slug === propertyId || p.id === propertyId
  );

  return (
    <div className="min-h-screen flex bg-canvas text-content-primary">
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Primary Sidebar"
        className={`hidden md:flex flex-col border-r border-border bg-surface transition-all duration-150 shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-white shadow-xs">
              <Hotel className="h-4 w-4" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <p className="text-sm font-semibold tracking-tight text-content-primary leading-none">
                  ReviewInsights
                </p>
                <p className="mt-0.5 text-[11px] text-content-muted">Hospitality BI</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded p-1 text-content-muted hover:bg-subtle hover:text-content-primary"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Command Palette Trigger */}
        <div className="p-2.5">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Open command palette"
            className={`flex w-full items-center justify-between rounded-md border border-border bg-subtle/60 px-2.5 py-1.5 text-xs text-content-secondary hover:border-border-strong hover:text-content-primary transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <Command className="h-3.5 w-3.5 shrink-0" />
              {!sidebarCollapsed && <span>Quick jump...</span>}
            </span>
            {!sidebarCollapsed && (
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-content-muted">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Dashboard sections" className="flex-1 space-y-1 px-2.5 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={{
                  pathname: item.to,
                  search: location.search,
                }}
                end={item.to === '/'}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-subtle text-brand'
                      : 'text-content-secondary hover:bg-subtle hover:text-content-primary'
                  }`
                }
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!sidebarCollapsed && item.showBadge && unresolvedFlaggedCount > 0 && (
                  <span className="rounded-full bg-sentiment-neg-bg px-1.5 py-0.5 text-[10px] font-semibold text-sentiment-neg tabular-nums">
                    {unresolvedFlaggedCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Import & Theme Controls */}
        <div className="border-t border-border p-2.5 space-y-1.5">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            title={sidebarCollapsed ? 'Import CSV/JSON' : undefined}
            className={`flex w-full items-center gap-2.5 rounded-md border border-border bg-surface px-2.5 py-2 text-xs font-medium text-content-primary hover:bg-subtle transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Upload className="h-4 w-4 text-brand shrink-0" />
            {!sidebarCollapsed && <span>Import CSV / JSON</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-64 flex-col bg-surface border-r border-border">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-white">
                  <Hotel className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">ReviewInsights</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation drawer"
                className="rounded p-1 text-content-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={{ pathname: item.to, search: location.search }}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-brand-subtle text-brand'
                          : 'text-content-secondary hover:bg-subtle'
                      }`
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.showBadge && unresolvedFlaggedCount > 0 && (
                      <span className="rounded-full bg-sentiment-neg-bg px-2 py-0.5 text-xs font-semibold text-sentiment-neg">
                        {unresolvedFlaggedCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setImportOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-medium text-white"
              >
                <Upload className="h-4 w-4" />
                Import CSV / JSON
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            {/* Breadcrumb & Mobile Hamburger */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="rounded-md p-1.5 text-content-secondary hover:bg-subtle md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
                <span className="text-content-muted hidden sm:inline">Portfolio</span>
                <span className="text-content-muted hidden sm:inline">/</span>
                <span className="font-medium text-content-secondary">
                  {selectedPropertyObj ? selectedPropertyObj.name : 'All Properties (4)'}
                </span>
                <span className="text-content-muted">/</span>
                <span className="font-semibold text-content-primary">
                  {currentRouteMeta.title}
                </span>
              </nav>
            </div>

            {/* Global Controls: Property Switcher, Date Presets, Theme Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Property Switcher */}
              <div className="relative flex items-center">
                <Building2 className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-content-muted" />
                <select
                  aria-label="Select hotel property"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="h-8 rounded-md border border-border bg-surface pl-8 pr-7 text-xs font-medium text-content-primary hover:border-border-strong focus:border-brand focus:outline-none"
                >
                  <option value="all">All Properties (4 Hotels)</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Presets */}
              <div
                role="group"
                aria-label="Date range presets"
                className="inline-flex items-center rounded-md border border-border bg-subtle p-0.5"
              >
                {DATE_PRESET_OPTIONS.map((opt) => {
                  const isActive = !from && !to && preset === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setShowCustomDates(false);
                        setPreset(opt.value);
                      }}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-surface text-content-primary shadow-2xs'
                          : 'text-content-secondary hover:text-content-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowCustomDates((v) => !v)}
                  aria-label="Toggle custom date range picker"
                  className={`rounded px-2 py-1 text-xs font-medium flex items-center gap-1 ${
                    from || to || showCustomDates
                      ? 'bg-surface text-brand shadow-2xs'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Custom</span>
                </button>
              </div>

              {/* Dark / Light Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-content-secondary hover:border-border-strong hover:text-content-primary transition-colors"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Expandable Custom Date Range Bar */}
          {(showCustomDates || from || to) && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-subtle/50 px-4 py-2 sm:px-6 text-xs">
              <span className="text-content-secondary font-medium">Custom Range:</span>
              <input
                type="date"
                aria-label="Start date"
                value={from}
                onChange={(e) => setCustomDateRange(e.target.value, to)}
                className="rounded border border-border bg-surface px-2 py-1 text-xs text-content-primary"
              />
              <span className="text-content-muted">to</span>
              <input
                type="date"
                aria-label="End date"
                value={to}
                onChange={(e) => setCustomDateRange(from, e.target.value)}
                className="rounded border border-border bg-surface px-2 py-1 text-xs text-content-primary"
              />
              {(from || to) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomDateRange('', '');
                    setShowCustomDates(false);
                  }}
                  className="text-brand hover:underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </header>

        {/* Page Header + Main View */}
        <main className="flex-1 px-4 py-6 sm:px-6 max-w-7xl w-full mx-auto">
          <ColdStartBanner />

          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-content-primary">
                {currentRouteMeta.title}
              </h1>
              <p className="text-xs text-content-secondary">{currentRouteMeta.subtitle}</p>
            </div>
          </div>

          {children}
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        properties={properties}
        onOpenImport={() => setImportOpen(true)}
      />

      <ImportModal open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
