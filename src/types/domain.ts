export type Project = {
  id: string;
  name?: string;
  state?: string;
  corridor?: string;
  contractor?: string;
  lengthKm?: number;
  baselineCost?: number;
  revisedCost?: number;
  startDate?: string;
  endDate?: string;
};

export type ProgressPoint = {
  projectId: string;
  date: string;
  plannedPhysicalPct?: number;
  actualPhysicalPct?: number;
  plannedAmount?: number;
  actualAmount?: number;
  cumulativePlanned?: number;
  cumulativeActual?: number;
  fundingSource?: string;
};

export type KPI = {
  totalProjects: number;
  weightedPhysicalProgressPct: number; // 0-100
  financialProgressPct: number; // 0-100
  totalVarianceINR: number; // currency
  variancePct: number; // 0-100
  atRiskProjects: number;
};
