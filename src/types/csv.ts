// CSV row types (raw, as parsed from files)
export type PhysicalProgressRow = {
  ProjectID: string;
  ProjectName?: string;
  State?: string;
  Corridor?: string;
  Contractor?: string;
  LengthKm?: number | string;
  Date: string;
  PlannedPhysicalPct?: number | string;
  ActualPhysicalPct?: number | string;
  Milestone?: string;
};

export type FinancialProgressRow = {
  ProjectID: string;
  Date: string;
  PlannedAmount?: number | string;
  ActualAmount?: number | string;
  CumulativePlanned?: number | string;
  CumulativeActual?: number | string;
  FundingSource?: string;
};

export type CsvMapping = {
  // header -> required field name
  [header: string]: keyof PhysicalProgressRow | keyof FinancialProgressRow | string;
};

export type CsvParseResult<T> = {
  rows: T[];
  headers: string[];
  errors: Array<{ row: number; column?: string; message: string }>;
};
