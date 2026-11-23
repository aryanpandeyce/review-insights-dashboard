import * as Dialog from '@radix-ui/react-dialog';
import {
  BarChart3,
  Building2,
  Calendar,
  Compass,
  Flag,
  GitCompare,
  LayoutDashboard,
  Moon,
  Search,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { Property } from '../../types/api';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  onOpenImport: () => void;
}

interface CommandAction {
  id: string;
  group: string;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  properties,
  onOpenImport,
}: CommandPaletteProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { setPropertyId, setPreset } = useGlobalFilters();
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const actions = useMemo<CommandAction[]>(() => {
    const navActions: CommandAction[] = [
      {
        id: 'nav-overview',
        group: 'Navigation',
        label: 'Go to Overview',
        subtitle: 'Executive KPIs & property cards',
        icon: <LayoutDashboard className="h-4 w-4" />,
        onSelect: () => navigate('/'),
      },
      {
        id: 'nav-trends',
        group: 'Navigation',
        label: 'Go to Trends & Volume',
        subtitle: 'Score trajectory & weekly/monthly volume',
        icon: <TrendingUp className="h-4 w-4" />,
        onSelect: () => navigate('/trends'),
      },
      {
        id: 'nav-distribution',
        group: 'Navigation',
        label: 'Go to Score & Guest Distribution',
        subtitle: 'Score histogram, trip types, and guest countries',
        icon: <BarChart3 className="h-4 w-4" />,
        onSelect: () => navigate('/distribution'),
      },
      {
        id: 'nav-topics',
        group: 'Navigation',
        label: 'Go to Topic Insights',
        subtitle: 'Rule-based topic sentiment strengths & weaknesses',
        icon: <Sparkles className="h-4 w-4" />,
        onSelect: () => navigate('/topics'),
      },
      {
        id: 'nav-reviews',
        group: 'Navigation',
        label: 'Go to Reviews Explorer',
        subtitle: 'Search, filter, inspect, and export guest reviews',
        icon: <Compass className="h-4 w-4" />,
        onSelect: () => navigate('/reviews'),
      },
      {
        id: 'nav-comparison',
        group: 'Navigation',
        label: 'Go to Property Comparison',
        subtitle: 'Side-by-side radar & metric benchmarking',
        icon: <GitCompare className="h-4 w-4" />,
        onSelect: () => navigate('/comparison'),
      },
      {
        id: 'nav-flagged',
        group: 'Navigation',
        label: 'Go to Flagged Reviews Queue',
        subtitle: 'Operational service-recovery queue',
        icon: <Flag className="h-4 w-4" />,
        onSelect: () => navigate('/flagged'),
      },
    ];

    const propertyActions: CommandAction[] = [
      {
        id: 'prop-all',
        group: 'Switch Property',
        label: 'All Properties (Portfolio View)',
        subtitle: 'Aggregate across all 4 European properties',
        icon: <Building2 className="h-4 w-4" />,
        onSelect: () => setPropertyId('all'),
      },
      ...properties.map((p) => ({
        id: `prop-${p.slug}`,
        group: 'Switch Property',
        label: p.name,
        subtitle: `${p.city}, ${p.country} • ${p.starRating}★`,
        icon: <Building2 className="h-4 w-4" />,
        onSelect: () => setPropertyId(p.slug),
      })),
    ];

    const utilActions: CommandAction[] = [
      {
        id: 'util-import',
        group: 'Actions',
        label: 'Import Reviews (CSV / JSON)',
        subtitle: 'Open drag-and-drop data uploader',
        icon: <Upload className="h-4 w-4" />,
        onSelect: () => onOpenImport(),
      },
      {
        id: 'util-theme',
        group: 'Actions',
        label: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
        icon: resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        onSelect: () => toggleTheme(),
      },
      {
        id: 'date-30d',
        group: 'Date Range Preset',
        label: 'Last 30 Days',
        icon: <Calendar className="h-4 w-4" />,
        onSelect: () => setPreset('30d'),
      },
      {
        id: 'date-90d',
        group: 'Date Range Preset',
        label: 'Last 90 Days',
        icon: <Calendar className="h-4 w-4" />,
        onSelect: () => setPreset('90d'),
      },
      {
        id: 'date-12m',
        group: 'Date Range Preset',
        label: 'Last 12 Months',
        icon: <Calendar className="h-4 w-4" />,
        onSelect: () => setPreset('12m'),
      },
      {
        id: 'date-all',
        group: 'Date Range Preset',
        label: 'All Time (18 Months)',
        icon: <Calendar className="h-4 w-4" />,
        onSelect: () => setPreset('all'),
      },
    ];

    return [...navActions, ...propertyActions, ...utilActions];
  }, [navigate, onOpenImport, properties, resolvedTheme, setPreset, setPropertyId, toggleTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q))
    );
  }, [actions, query]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2 rounded-lg border border-border bg-surface shadow-elevated overflow-hidden"
        >
          <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-content-muted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command, route, or hotel name..."
              autoFocus
              className="w-full bg-transparent text-sm text-content-primary placeholder:text-content-muted focus:outline-none"
            />
            <kbd className="rounded border border-border bg-subtle px-1.5 py-0.5 text-[10px] font-mono text-content-muted">
              ESC
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-xs text-content-muted">
                No matching commands found.
              </p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onSelect();
                    setQuery('');
                    onOpenChange(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-subtle transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-content-secondary shrink-0">{item.icon}</span>
                    <div className="truncate">
                      <p className="font-medium text-content-primary truncate">{item.label}</p>
                      {item.subtitle && (
                        <p className="text-xs text-content-muted truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <span className="ml-2 shrink-0 text-[11px] text-content-muted">
                    {item.group}
                  </span>
                </button>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
