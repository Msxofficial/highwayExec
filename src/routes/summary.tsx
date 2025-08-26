import React from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '@/store/useDataStore';
import { formatINR, formatPercent } from '@/lib/format';
import { generateSummaryDraft, resolveTokens } from '@/services/summaryRules';
import { exportElementToPdf } from '@/services/exportPdf';
import { exportTextToDocx } from '@/services/exportDocx';
import { FileDown, FileText, Wand2, Hash, Layout, Eye } from 'lucide-react';

const TOKENS = [
  'ReportPeriod',
  'TotalProjects',
  'WeightedPhysicalProgress',
  'FinancialProgressPct',
  'TotalVarianceINR',
  'VariancePct',
  'ProjectsAtRisk',
];

export default function Summary() {
  const kpi = useDataStore((s) => s.kpi);
  const [template, setTemplate] = React.useState<'Monthly Program Summary' | 'Quarterly Financial Review' | 'Delivery Risk Snapshot'>('Monthly Program Summary');
  const [editor, setEditor] = React.useState('');
  const previewRef = React.useRef<HTMLDivElement>(null);

  const values = React.useMemo(() => ({
    ReportPeriod: template,
    TotalProjects: String(kpi?.totalProjects ?? 0),
    WeightedPhysicalProgress: formatPercent(kpi?.weightedPhysicalProgressPct),
    FinancialProgressPct: formatPercent(kpi?.financialProgressPct),
    TotalVarianceINR: formatINR(kpi?.totalVarianceINR),
    VariancePct: formatPercent(kpi?.variancePct),
    ProjectsAtRisk: String(kpi?.atRiskProjects ?? 0),
  }), [kpi, template]);

  const resolved = React.useMemo(() => resolveTokens(editor, values), [editor, values]);

  function insertToken(token: string) {
    setEditor((t) => t + (t.endsWith('\n') || t.length === 0 ? '' : ' ') + `{{${token}}}`);
  }

  async function handleExportPdf() {
    if (previewRef.current) {
      await exportElementToPdf(previewRef.current, 'HighwayExec-Summary.pdf');
    }
  }

  async function handleExportDocx() {
    await exportTextToDocx('Executive Summary', resolved, 'HighwayExec-Summary.docx');
  }

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Layout size={20}/> Executive Summary</h1>
          <p className="text-gray-600">Editable blocks, tokens, templates, and export actions.</p>
        </div>
        <select
          aria-label="Template"
          className="border rounded-lg px-3 py-2"
          value={template}
          onChange={(e) => setTemplate(e.target.value as any)}
        >
          <option>Monthly Program Summary</option>
          <option>Quarterly Financial Review</option>
          <option>Delivery Risk Snapshot</option>
        </select>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium flex items-center gap-2"><Layout size={18}/> Editor</h2>
            <button
              className="inline-flex items-center rounded-lg px-3 py-2 border border-gray-300 hover:bg-gray-50 gap-2"
              onClick={() => setEditor(generateSummaryDraft(kpi ?? {
                totalProjects: 0,
                weightedPhysicalProgressPct: 0,
                financialProgressPct: 0,
                totalVarianceINR: 0,
                variancePct: 0,
                atRiskProjects: 0,
              }, template))}
            >
              <Wand2 size={16}/> Generate Draft
            </button>
          </div>
          <textarea
            aria-label="Summary editor"
            className="w-full h-[400px] resize-y border rounded-lg p-3 font-mono text-sm"
            placeholder="Write or generate your summary here. Use tokens like {{TotalProjects}}."
            value={editor}
            onChange={(e) => setEditor(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {TOKENS.map((t) => (
              <button key={t} onClick={() => insertToken(t)} className="px-2 py-1 text-sm border rounded-lg hover:bg-gray-50 inline-flex items-center gap-1" aria-label={`Insert ${t}`}>
                <Hash size={14}/> {`{{${t}}}`}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium flex items-center gap-2"><Eye size={18}/> Preview</h2>
            <div className="flex gap-2">
              <button onClick={handleExportPdf} className="btn-primary inline-flex items-center gap-2"><FileDown size={16}/> Export PDF</button>
              <button onClick={handleExportDocx} className="inline-flex items-center rounded-lg px-3 py-2 border border-gray-300 hover:bg-gray-50 gap-2"><FileText size={16}/> Export DOCX</button>
            </div>
          </div>
          <div ref={previewRef} className="prose max-w-none whitespace-pre-wrap">{resolved}</div>
        </div>
      </div>

      <div className="mt-6">
        <Link to="/dashboard" className="inline-flex items-center rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50">Back to Dashboard</Link>
      </div>
    </main>
  );
}
