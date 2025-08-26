import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseCsv } from '@/services/csvParser';
import type { PhysicalProgressRow, FinancialProgressRow } from '@/types/csv';
import type { Project, ProgressPoint } from '@/types/domain';
import { coerceNumber } from '@/lib/validators';
import { useDataStore } from '@/store/useDataStore';
import { UploadCloud, MapPin, CheckCircle2, Save, ListChecks, RefreshCw } from 'lucide-react';

type Mapping<T extends object> = Record<string, keyof T | ''>;

const REQUIRED_PHYSICAL: Array<keyof PhysicalProgressRow> = ['ProjectID', 'Date', 'ActualPhysicalPct'];
const REQUIRED_FINANCIAL: Array<keyof FinancialProgressRow> = ['ProjectID', 'Date', 'ActualAmount'];

function PreviewTable({ rows }: { rows: any[] }) {
  const headers = rows.length ? Object.keys(rows[0]!) : [];
  return (
    <div className="overflow-auto max-h-80 border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 border-b">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              {headers.map((h) => (
                <td key={h} className="px-3 py-2 border-b whitespace-nowrap">{String(r[h] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Review() {
  const navigate = useNavigate();
  const setData = useDataStore((s) => s.setData);
  const refreshKPIs = useDataStore((s) => s.refreshKPIs);

  const [physFile, setPhysFile] = React.useState<File | null>(null);
  const [finFile, setFinFile] = React.useState<File | null>(null);
  const [physRows, setPhysRows] = React.useState<PhysicalProgressRow[]>([]);
  const [finRows, setFinRows] = React.useState<FinancialProgressRow[]>([]);
  const [physHeaders, setPhysHeaders] = React.useState<string[]>([]);
  const [finHeaders, setFinHeaders] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [physMap, setPhysMap] = React.useState<Mapping<PhysicalProgressRow>>({ ProjectID: 'ProjectID', Date: 'Date', ActualPhysicalPct: 'ActualPhysicalPct' } as any);
  const [finMap, setFinMap] = React.useState<Mapping<FinancialProgressRow>>({ ProjectID: 'ProjectID', Date: 'Date', ActualAmount: 'ActualAmount' } as any);
  type Preset = { name: string; physMap: Mapping<PhysicalProgressRow>; finMap: Mapping<FinancialProgressRow> };
  const PRESETS_KEY = 'highwayexec-mapping-presets';
  const [presets, setPresets] = React.useState<Preset[]>(() => {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { name: 'Default (exact headers)', physMap: { ProjectID: 'ProjectID', Date: 'Date', ActualPhysicalPct: 'ActualPhysicalPct' } as any, finMap: { ProjectID: 'ProjectID', Date: 'Date', ActualAmount: 'ActualAmount' } as any },
    ];
  });
  const [selectedPreset, setSelectedPreset] = React.useState<string>(presets[0]?.name ?? '');

  function savePresets(next: Preset[]) {
    setPresets(next);
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(next)); } catch {}
  }

  function applyPreset(name: string) {
    const p = presets.find((x) => x.name === name);
    if (!p) return;
    setPhysMap(p.physMap);
    setFinMap(p.finMap);
  }

  async function handleParse() {
    if (!physFile || !finFile) return;
    setLoading(true);
    const [pRes, fRes] = await Promise.all([
      parseCsv<PhysicalProgressRow>(physFile),
      parseCsv<FinancialProgressRow>(finFile),
    ]);
    setPhysRows(pRes.rows);
    setFinRows(fRes.rows);
    setPhysHeaders(pRes.headers);
    setFinHeaders(fRes.headers);
    setLoading(false);
  }

  function validate(): string[] {
    const errs: string[] = [];
    for (const key of REQUIRED_PHYSICAL) {
      if (!Object.values(physMap).includes(key)) errs.push(`Physical: missing mapping for ${key}`);
    }
    for (const key of REQUIRED_FINANCIAL) {
      if (!Object.values(finMap).includes(key)) errs.push(`Financial: missing mapping for ${key}`);
    }
    // Basic row checks (first 50)
    physRows.slice(0, 50).forEach((r, idx) => {
      const pid = r[physMap.ProjectID as keyof PhysicalProgressRow] as any;
      const date = r[physMap.Date as keyof PhysicalProgressRow] as any;
      const ap = r[physMap.ActualPhysicalPct as keyof PhysicalProgressRow] as any;
      if (!pid) errs.push(`Physical row ${idx + 1}: ProjectID blank`);
      if (!date) errs.push(`Physical row ${idx + 1}: Date blank`);
      const n = coerceNumber(ap);
      if (n == null || n < 0 || n > 100) errs.push(`Physical row ${idx + 1}: ActualPhysicalPct invalid`);
    });
    finRows.slice(0, 50).forEach((r, idx) => {
      const pid = r[finMap.ProjectID as keyof FinancialProgressRow] as any;
      const date = r[finMap.Date as keyof FinancialProgressRow] as any;
      const amt = r[finMap.ActualAmount as keyof FinancialProgressRow] as any;
      if (!pid) errs.push(`Financial row ${idx + 1}: ProjectID blank`);
      if (!date) errs.push(`Financial row ${idx + 1}: Date blank`);
      const n = coerceNumber(amt);
      if (n == null) errs.push(`Financial row ${idx + 1}: ActualAmount invalid`);
    });
    return errs;
  }

  function toDomain(): { projects: Project[]; points: ProgressPoint[] } {
    const projectsMap = new Map<string, Project>();
    const points: ProgressPoint[] = [];
    for (const r of physRows) {
      const projectId = String((r as any)[physMap.ProjectID] ?? '').trim();
      if (!projectId) continue;
      if (!projectsMap.has(projectId)) projectsMap.set(projectId, { id: projectId });
      points.push({
        projectId,
        date: String((r as any)[physMap.Date] ?? ''),
        actualPhysicalPct: coerceNumber((r as any)[physMap.ActualPhysicalPct]),
        plannedPhysicalPct: coerceNumber((r as any)['PlannedPhysicalPct']),
      });
    }
    for (const r of finRows) {
      const projectId = String((r as any)[finMap.ProjectID] ?? '').trim();
      if (!projectId) continue;
      if (!projectsMap.has(projectId)) projectsMap.set(projectId, { id: projectId });
      points.push({
        projectId,
        date: String((r as any)[finMap.Date] ?? ''),
        actualAmount: coerceNumber((r as any)[finMap.ActualAmount]),
        plannedAmount: coerceNumber((r as any)['PlannedAmount']),
        cumulativeActual: coerceNumber((r as any)['CumulativeActual']),
        cumulativePlanned: coerceNumber((r as any)['CumulativePlanned']),
        fundingSource: (r as any)['FundingSource'] ? String((r as any)['FundingSource']) : undefined,
      });
    }
    return { projects: Array.from(projectsMap.values()), points };
  }

  const errors = React.useMemo(() => validate(), [physMap, finMap, physRows, finRows]);

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><UploadCloud size={20}/> Upload & Map Fields</h1>
        <p className="text-gray-600 mt-2">Upload Physical & Financial CSVs, map columns, and validate.</p>
      </header>

      <div className="grid gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><UploadCloud size={18}/> Step 1-2: Upload CSVs</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-gray-600">PhysicalProgress.csv</span>
              <input aria-label="Upload physical CSV" type="file" accept=".csv" className="mt-1 block w-full" onChange={(e) => setPhysFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">FinancialProgress.csv</span>
              <input aria-label="Upload financial CSV" type="file" accept=".csv" className="mt-1 block w-full" onChange={(e) => setFinFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div className="mt-4">
            <button className="btn-primary mr-2 inline-flex items-center gap-2" onClick={handleParse} disabled={!physFile || !finFile || loading}><ListChecks size={16}/> {loading ? 'Parsing…' : 'Parse & Preview'}</button>
            <button className="inline-flex items-center rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 gap-2" onClick={handleParse} disabled={!physFile || !finFile || loading}><RefreshCw size={16}/> Re-Parse</button>
          </div>
        </div>

        {(physRows.length > 0 || finRows.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-medium mb-3">Physical Preview (first 50)</h3>
              <PreviewTable rows={physRows} />
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-medium mb-3">Financial Preview (first 50)</h3>
              <PreviewTable rows={finRows} />
            </div>
          </div>
        )}

        {(physHeaders.length > 0 || finHeaders.length > 0) && (
          <div className="card p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><MapPin size={18}/> Step 4: Map Columns</h2>
            <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-end">
              <div>
                <label className="block text-sm text-gray-700">Preset</label>
                <div className="flex gap-2">
                  <select className="border rounded-lg px-2 py-1" value={selectedPreset} onChange={(e) => { setSelectedPreset(e.target.value); applyPreset(e.target.value); }}>
                    {presets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                  <button
                    className="inline-flex items-center rounded-lg px-3 py-1.5 border border-gray-300 hover:bg-gray-50 gap-2"
                    onClick={() => {
                      const name = prompt('Save current mapping as preset name:');
                      if (!name) return;
                      const existing = presets.filter((p) => p.name !== name);
                      const next = [...existing, { name, physMap, finMap }];
                      savePresets(next);
                      setSelectedPreset(name);
                    }}
                  ><Save size={14}/> Save Preset</button>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Physical Required Fields</h4>
                {REQUIRED_PHYSICAL.map((req) => (
                  <div key={req} className="flex items-center gap-2 mb-2">
                    <label className="w-40 text-sm text-gray-700">{String(req)}</label>
                    <select className="border rounded-lg px-2 py-1 flex-1" value={physMap[req as any] ?? ''} onChange={(e) => setPhysMap((m) => ({ ...m, [req]: e.target.value as any }))}>
                      <option value="">—</option>
                      {physHeaders.map((h) => (
                        <option key={h} value={h as any}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-medium mb-2">Financial Required Fields</h4>
                {REQUIRED_FINANCIAL.map((req) => (
                  <div key={req} className="flex items-center gap-2 mb-2">
                    <label className="w-40 text-sm text-gray-700">{String(req)}</label>
                    <select className="border rounded-lg px-2 py-1 flex-1" value={finMap[req as any] ?? ''} onChange={(e) => setFinMap((m) => ({ ...m, [req]: e.target.value as any }))}>
                      <option value="">—</option>
                      {finHeaders.map((h) => (
                        <option key={h} value={h as any}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2"><CheckCircle2 size={18}/> Validation</h2>
          {errors.length === 0 ? (
            <div className="text-green-700">No blocking issues detected. You can proceed.</div>
          ) : (
            <ul className="list-disc pl-6 text-red-700">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>

        <div className="flex gap-3">
          <button
            className="btn-primary disabled:opacity-60"
            disabled={errors.length > 0 || physRows.length === 0 || finRows.length === 0}
            onClick={async () => {
              const { projects, points } = toDomain();
              setData(projects, points);
              await refreshKPIs();
              navigate('/dashboard');
            }}
          >
            Proceed to Dashboard
          </button>
          <Link to="/" className="inline-flex items-center rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50">Back</Link>
        </div>
      </div>
    </main>
  );
}
