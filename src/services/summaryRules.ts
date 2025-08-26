import type { KPI } from '@/types/domain';

export function generateSummaryDraft(kpi: KPI, period = 'Monthly Program Summary'): string {
  const lines: string[] = [];
  lines.push(`# ${period}`);
  lines.push('');
  lines.push(`Total Projects: {{TotalProjects}}`);
  lines.push(`Weighted Physical Progress: {{WeightedPhysicalProgress}}`);
  lines.push(`Financial Progress: {{FinancialProgressPct}}`);
  lines.push(`Total Variance: {{TotalVarianceINR}} ({{VariancePct}})`);
  lines.push(`Projects At Risk: {{ProjectsAtRisk}}`);
  lines.push('');
  if (kpi.variancePct > 5) {
    lines.push('Significant adverse financial variance observed; corrective cashflow alignment is recommended.');
  } else if (kpi.variancePct < -5) {
    lines.push('Favorable variance against plan; ensure planned commitments are balanced with delivery capacity.');
  }
  if (kpi.atRiskProjects > 0) {
    lines.push(`${kpi.atRiskProjects} project(s) show persistent schedule slippage and require focused expediting.`);
  }
  return lines.join('\n');
}

export function resolveTokens(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(.*?)\}\}/g, (_, key) => values[key.trim()] ?? '—');
}
