import React, { createContext, useCallback, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DatePreset } from '../types/api';

interface FilterContextValue {
  propertyId: string;
  preset: DatePreset;
  from: string;
  to: string;
  setPropertyId: (propertyId: string) => void;
  setPreset: (preset: DatePreset) => void;
  setCustomDateRange: (from: string, to: string) => void;
  resetGlobalFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

const VALID_PRESETS: readonly DatePreset[] = ['30d', '90d', '12m', 'all'];

export function FilterProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();

  const propertyId = searchParams.get('propertyId') || 'all';
  const rawPreset = searchParams.get('preset') as DatePreset | null;
  const preset: DatePreset =
    rawPreset && VALID_PRESETS.includes(rawPreset) ? rawPreset : 'all';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  const setPropertyId = useCallback(
    (nextPropertyId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!nextPropertyId || nextPropertyId === 'all') {
          next.delete('propertyId');
        } else {
          next.set('propertyId', nextPropertyId);
        }
        // Reset pagination page when switching property
        next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const setPreset = useCallback(
    (nextPreset: DatePreset) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextPreset === 'all') {
          next.delete('preset');
        } else {
          next.set('preset', nextPreset);
        }
        next.delete('from');
        next.delete('to');
        next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const setCustomDateRange = useCallback(
    (nextFrom: string, nextTo: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextFrom) next.set('from', nextFrom);
        else next.delete('from');
        if (nextTo) next.set('to', nextTo);
        else next.delete('to');
        next.delete('preset');
        next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const resetGlobalFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return (
    <FilterContext.Provider
      value={{
        propertyId,
        preset,
        from,
        to,
        setPropertyId,
        setPreset,
        setCustomDateRange,
        resetGlobalFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useGlobalFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error('useGlobalFilters must be used within a FilterProvider');
  }
  return ctx;
}
