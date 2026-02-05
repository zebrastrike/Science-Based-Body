'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminRequest } from '@/lib/api';

interface SeriesPoint {
  date: string;
  value: number;
}

interface TopProduct {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

interface AnalyticsData {
  revenueSeries: SeriesPoint[];
  ordersSeries: SeriesPoint[];
  acquisitionSeries: SeriesPoint[];
  topProducts: TopProduct[];
  stats: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    conversionRate: number;
  };
}

const rangeOptions = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'custom', label: 'Custom' },
];

const buildLinePath = (values: number[], width = 320, height = 120) => {
  if (values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
};

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [range, customFrom, customTo]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('range', range);
      if (range === 'custom' && customFrom && customTo) {
        params.set('from', customFrom);
        params.set('to', customTo);
      }

      const response = await adminRequest<AnalyticsData>(
        `/admin/analytics?${params.toString()}`,
      );
      setData(response);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      const demoSeries = Array.from({ length: 12 }).map((_, index) => ({
        date: new Date(Date.now() - (11 - index) * 86400000).toISOString(),
        value: Math.round(1200 + Math.random() * 800),
      }));
      setData({
        revenueSeries: demoSeries,
        ordersSeries: demoSeries.map((point) => ({ ...point, value: Math.round(point.value / 100) })),
        acquisitionSeries: demoSeries.map((point) => ({ ...point, value: Math.round(point.value / 150) })),
        topProducts: [
          { id: '1', name: 'Semaglutide', unitsSold: 124, revenue: 18490 },
          { id: '2', name: 'BPC-157', unitsSold: 88, revenue: 8190 },
          { id: '3', name: 'GHK-Cu', unitsSold: 62, revenue: 3410 },
        ],
        stats: {
          revenue: 42890,
          orders: 361,
          avgOrderValue: 118.8,
          conversionRate: 3.6,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const barSeries = useMemo(() => data?.ordersSeries ?? [], [data]);
  const maxBarValue = Math.max(...barSeries.map((point) => point.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-zinc-400 mt-1">Performance trends and growth indicators.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                range === option.value
                  ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/40'
                  : 'text-zinc-400 border-border hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 bg-background-secondary border border-border rounded-lg text-white text-sm"
              />
              <span className="text-zinc-500">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 bg-background-secondary border border-border rounded-lg text-white text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background-card rounded-xl p-6 border border-border animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-24 mb-3"></div>
              <div className="h-8 bg-zinc-800 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background-card rounded-xl p-6 border border-border">
              <p className="text-sm text-zinc-400">Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">{formatCurrency(data.stats.revenue)}</p>
              <p className="text-sm text-zinc-500 mt-2">Gross sales in range</p>
            </div>
            <div className="bg-background-card rounded-xl p-6 border border-border">
              <p className="text-sm text-zinc-400">Orders</p>
              <p className="text-3xl font-bold text-white mt-2">{data.stats.orders}</p>
              <p className="text-sm text-zinc-500 mt-2">Completed transactions</p>
            </div>
            <div className="bg-background-card rounded-xl p-6 border border-border">
              <p className="text-sm text-zinc-400">Avg Order Value</p>
              <p className="text-3xl font-bold text-white mt-2">{formatCurrency(data.stats.avgOrderValue)}</p>
              <p className="text-sm text-zinc-500 mt-2">Across all orders</p>
            </div>
            <div className="bg-background-card rounded-xl p-6 border border-border">
              <p className="text-sm text-zinc-400">Conversion Rate</p>
              <p className="text-3xl font-bold text-white mt-2">{data.stats.conversionRate}%</p>
              <p className="text-sm text-zinc-500 mt-2">Storewide average</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-background-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Revenue</h2>
                <span className="text-sm text-zinc-500">USD</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-40 text-brand-primary">
                <path
                  d={buildLinePath(data.revenueSeries.map((point) => point.value))}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="bg-background-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Orders</h2>
                <span className="text-sm text-zinc-500">Count</span>
              </div>
              <div className="flex items-end gap-2 h-40">
                {barSeries.map((point) => (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-brand-primary/60 rounded-md"
                      style={{ height: `${(point.value / maxBarValue) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-background-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Customer Acquisition</h2>
                <span className="text-sm text-zinc-500">New customers</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-40 text-green-400">
                <path
                  d={buildLinePath(data.acquisitionSeries.map((point) => point.value))}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="bg-background-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Top Products</h2>
                <span className="text-sm text-zinc-500">Research Use Only</span>
              </div>
              <div className="space-y-3">
                {data.topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{product.name}</p>
                      <span className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                        Research Use Only
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{product.unitsSold} sold</p>
                      <p className="text-xs text-zinc-500">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-background-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Top Selling Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Product</th>
                    <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Units Sold</th>
                    <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{product.name}</span>
                          <span className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full w-fit">
                            Research Use Only
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{product.unitsSold}</td>
                      <td className="px-4 py-3 text-white">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
