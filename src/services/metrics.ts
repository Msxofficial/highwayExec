import type { Project, ProgressPoint, KPI } from '@/types/domain';

function safeDiv(a: number, b: number) {
  return b === 0 ? 0 : a / b;
}

export function computeKPIs(projects: Project[], points: ProgressPoint[]): KPI {
  const totalProjects = projects.length;

  // Weighted physical progress by lengthKm (fallback equal weight)
  let weightSum = 0;
  let weightedActual = 0;
  let weightedPlanned = 0;
  const lengthByProject = new Map(projects.map((p) => [p.id, p.lengthKm ?? 1]));
  for (const pt of points) {
    if (pt.actualPhysicalPct == null && pt.plannedPhysicalPct == null) continue;
    const w = lengthByProject.get(pt.projectId) ?? 1;
    weightSum += w;
    weightedActual += (pt.actualPhysicalPct ?? 0) * w;
    weightedPlanned += (pt.plannedPhysicalPct ?? 0) * w;
  }
  const weightedPhysicalProgressPct = weightSum ? (weightedActual / weightSum) : 0;

  // Financial progress: last cumulative actual / planned
  const latestByProject = new Map<string, ProgressPoint>();
  for (const pt of points) {
    latestByProject.set(pt.projectId, pt);
  }
  let cumA = 0;
  let cumP = 0;
  latestByProject.forEach((pt) => {
    cumA += pt.cumulativeActual ?? 0;
    cumP += pt.cumulativePlanned ?? 0;
  });
  const financialProgressPct = safeDiv(cumA, cumP) * 100;

  const totalVarianceINR = cumA - cumP;
  const variancePct = safeDiv(totalVarianceINR, cumP) * 100;

  // At-risk projects: heuristic based on physical slippage
  let atRiskProjects = 0;
  latestByProject.forEach((pt) => {
    const diff = (pt.actualPhysicalPct ?? 0) - (pt.plannedPhysicalPct ?? 0);
    if (diff < -5) atRiskProjects += 1; // Major delay
  });

  return {
    totalProjects,
    weightedPhysicalProgressPct,
    financialProgressPct,
    totalVarianceINR,
    variancePct,
    atRiskProjects,
  };
}
