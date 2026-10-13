import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import * as mock from './mockData';

type MockMap = Partial<{
  projects: typeof mock.mockProjects;
  properties: typeof mock.mockProperties;
  leads: typeof mock.mockLeads;
  staff: typeof mock.mockStaff;
  staff_activities: typeof mock.mockActivities;
  bookings: typeof mock.mockBookings;
  installments: typeof mock.mockInstallments;
  transactions: typeof mock.mockTransactions;
  featured_listings: typeof mock.mockFeatured;
  homepage_banners: typeof mock.mockBanners;
  site_settings: typeof mock.mockSettings | null;
  web_inquiries: typeof mock.mockInquiries;
}>;

const mockData: MockMap = {
  projects: mock.mockProjects,
  properties: mock.mockProperties,
  leads: mock.mockLeads,
  staff: mock.mockStaff,
  staff_activities: mock.mockActivities,
  bookings: mock.mockBookings,
  installments: mock.mockInstallments,
  transactions: mock.mockTransactions,
  featured_listings: mock.mockFeatured,
  homepage_banners: mock.mockBanners,
  site_settings: mock.mockSettings,
  web_inquiries: mock.mockInquiries,
};

export interface QueryConfig {
  table: string;
  select?: string;
  order?: { column: string; ascending?: boolean };
  eq?: { column: string; value: string };
  limit?: number;
  maybeSingle?: boolean;
}

export function useSupabaseData<T = unknown>(
  configs: QueryConfig | QueryConfig[],
  options?: { mockKey?: keyof MockMap }
): { data: T[] | T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T[] | T | null>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const configList = Array.isArray(configs) ? configs : [configs];

  const fetchData = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        configList.map(async (cfg) => {
          let query = supabase.from(cfg.table).select(cfg.select || '*');
          if (cfg.eq) query = query.eq(cfg.eq.column, cfg.eq.value);
          if (cfg.order) query = query.order(cfg.order.column, { ascending: cfg.order.ascending ?? false });
          if (cfg.limit) query = query.limit(cfg.limit);
          if (cfg.maybeSingle) {
            const { data: d, error: e } = await query.maybeSingle();
            if (e) throw e;
            return d;
          }
          const { data: d, error: e } = await query;
          if (e) throw e;
          return d || [];
        })
      );

      const result = configList.length === 1 ? results[0] : results;
      setData(result as T[] | T | null);
    } catch (err) {
      console.error(`Supabase query failed, falling back to mock data:`, err);
      setError(err instanceof Error ? err.message : 'Connection failed');

      const mockKey = options?.mockKey;
      if (mockKey && mockKey in mockData) {
        const mockVal = mockData[mockKey];
        const result = configList.length === 1 ? mockVal : [mockVal];
        setData(result as T[] | T | null);
      } else {
        setData((Array.isArray(configs) ? [] : []) as T[] | T | null);
      }
    } finally {
      setLoading(false);
    }
  }, [configList.length, options?.mockKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reload = useCallback(() => {
    hasFetched.current = false;
    fetchData();
  }, [fetchData]);

  return { data, loading, error, reload };
}
