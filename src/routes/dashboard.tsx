import React from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '@/store/useDataStore';
import { formatINR, formatPercent } from '@/lib/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ProgressPoint } from '@/types/domain';
import { BarChart2, LineChart as LineChartIcon, RefreshCw, FileText, AlertTriangle, Layers3, Percent, Database, UploadCloud } from 'lucide-react';

export default function Dashboard() {
  const kpi = useDataStore((s) => s.kpi);
  const refreshKPIs = useDataStore((s) => s.refreshKPIs);
  const loading = useDataStore((s) => s.loading);
  const points = useDataStore((s) => s.points);
  const projects = useDataStore((s) => s.projects);
  const currentSource = useDataStore((s) => s.currentSource);
  const switchToSample = useDataStore((s) => s.switchToSample);
  const switchToUploaded = useDataStore((s) => s.switchToUploaded);
  const hasUploaded = useDataStore((s) => s.uploadedProjects.length > 0 || s.uploadedPoints.length > 0);

  // Aggregate financial series by date (sum cumulativeActual/Planned across projects)
  const financialSeries = React.useMemo(() => {
    const byDate = new Map<string, { date: string; cumulativeActual?: number; cumulativePlanned?: number }>();
    for (const p of points) {
      if (!p.date) continue;
      const entry = byDate.get(p.date) ?? { date: p.date };
      if (p.cumulativeActual != null) entry.cumulativeActual = (entry.cumulativeActual ?? 0) + (p.cumulativeActual ?? 0);
      if (p.cumulativePlanned != null) entry.cumulativePlanned = (entry.cumulativePlanned ?? 0) + (p.cumulativePlanned ?? 0);
      byDate.set(p.date, entry);
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [points]);

  // Aggregate physical progress (avg of available values per date)
  const physicalSeries = React.useMemo(() => {
    const byDate = new Map<string, { date: string; actualSum: number; plannedSum: number; countA: number; countP: number }>();
    for (const p of points) {
      if (!p.date) continue;
      const entry = byDate.get(p.date) ?? { date: p.date, actualSum: 0, plannedSum: 0, countA: 0, countP: 0 };
      if (p.actualPhysicalPct != null) { entry.actualSum += p.actualPhysicalPct; entry.countA += 1; }
      if (p.plannedPhysicalPct != null) { entry.plannedSum += p.plannedPhysicalPct; entry.countP += 1; }
      byDate.set(p.date, entry);
    }
    return Array.from(byDate.values()).map((e) => ({
      date: e.date,
      actual: e.countA ? e.actualSum / e.countA : undefined,
      planned: e.countP ? e.plannedSum / e.countP : undefined,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [points]);

  // Table: latest metrics per project
  type Row = { id: string; latestDate?: string; physicalPct?: number; cumulativeActual?: number; cumulativePlanned?: number; variance?: number };
  const tableData: Row[] = React.useMemo(() => {
    const latest: Record<string, ProgressPoint | undefined> = {};
    for (const pt of points) {
      const prev = latest[pt.projectId];
      if (!prev || (pt.date ?? '') > (prev.date ?? '')) latest[pt.projectId] = pt;
    }
    return projects.map((pr) => {
      const pt = latest[pr.id!];
      const variance = pt && pt.cumulativeActual != null && pt.cumulativePlanned != null
        ? pt.cumulativeActual - pt.cumulativePlanned
        : undefined;
      return {
        id: pr.id!,
        latestDate: pt?.date,
        physicalPct: pt?.actualPhysicalPct,
        cumulativeActual: pt?.cumulativeActual,
        cumulativePlanned: pt?.cumulativePlanned,
        variance,
      } as Row;
    });
  }, [projects, points]);

  const columns = React.useMemo<ColumnDef<Row>[]>(() => [
    { header: 'Project ID', accessorKey: 'id' },
    { header: 'Last Update', accessorKey: 'latestDate' },
    { header: 'Physical', accessorKey: 'physicalPct', cell: ({ getValue }) => formatPercent(getValue() as number | undefined) },
    { header: 'Cum. Actual', accessorKey: 'cumulativeActual', cell: ({ getValue }) => formatINR(getValue() as number | undefined) },
    { header: 'Cum. Planned', accessorKey: 'cumulativePlanned', cell: ({ getValue }) => formatINR(getValue() as number | undefined) },
    { header: 'Variance', accessorKey: 'variance', cell: ({ getValue }) => formatINR(getValue() as number | undefined) },
  ], []);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-gray-600">KPIs, charts and a projects table.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs rounded-full border px-2 py-1 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-gray-700 dark:text-slate-200">Source: {currentSource}</span>
          <button
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 border ${currentSource==='sample' ? 'bg-brand text-white border-brand' : 'border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}
            onClick={switchToSample}
            disabled={loading}
            aria-pressed={currentSource==='sample'}
          >
            <Database size={16}/> Sample Data
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 border ${currentSource==='uploaded' ? 'bg-brand text-white border-brand' : 'border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}
            onClick={switchToUploaded}
            disabled={!hasUploaded || loading}
            aria-pressed={currentSource==='uploaded'}
            title={!hasUploaded ? 'No uploaded data found' : 'Show uploaded data'}
          >
            <UploadCloud size={16}/> Uploaded Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="text-sm text-gray-500 flex items-center gap-2"><Layers3 size={16}/> Total Projects</div>
          <div className="text-2xl font-semibold">{kpi?.totalProjects ?? 0}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500 flex items-center gap-2"><Percent size={16}/> Weighted Physical Progress</div>
          <div className="text-2xl font-semibold">{formatPercent(kpi?.weightedPhysicalProgressPct)}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500 flex items-center gap-2"><LineChartIcon size={16}/> Financial Progress</div>
          <div className="text-2xl font-semibold">{formatPercent(kpi?.financialProgressPct)}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500 flex items-center gap-2"><AlertTriangle size={16}/> Variance (₹)</div>
          <div className="text-2xl font-semibold">{formatINR(kpi?.totalVarianceINR)}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500 flex items-center gap-2"><AlertTriangle size={16}/> Variance (%)</div>
          <div className="text-2xl font-semibold">{formatPercent(kpi?.variancePct)}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500 flex items-center gap-2"><AlertTriangle size={16}/> At-Risk Projects</div>
          <div className="text-2xl font-semibold">{kpi?.atRiskProjects ?? 0}</div>
        </div>
      </div>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2"><LineChartIcon size={18}/> Cumulative Financials</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financialSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${Math.round((v as number) / 1_00_000)}L`} />
                <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="cumulativeActual" name="Actual" stroke="#0ea5e9" dot={false} />
                <Line type="monotone" dataKey="cumulativePlanned" name="Planned" stroke="#22c55e" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2"><BarChart2 size={18}/> Average Physical Progress</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: any) => formatPercent(Number(v))} />
                <Legend />
                <Bar dataKey="actual" name="Actual %" fill="#6366f1" />
                <Bar dataKey="planned" name="Planned %" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Projects Table */}
      <section className="card p-4 mt-6">
        <h3 className="font-medium mb-3 flex items-center gap-2"><FileText size={18}/> Projects</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="text-left">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-2 border-b bg-gray-50 text-gray-600 font-medium">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 border-b whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <Link to="/summary" className="btn-primary inline-flex items-center gap-2"><FileText size={16}/> Generate Summary</Link>
        <button onClick={refreshKPIs} className="inline-flex items-center rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50 gap-2" disabled={loading}><RefreshCw size={16}/> {loading ? 'Refreshing…' : 'Refresh KPIs'}</button>
        <Link to="/settings" className="inline-flex items-center rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50">Settings</Link>
      </div>
    </main>
  );
}
