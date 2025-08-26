import Papa, { type ParseResult, type ParseError } from 'papaparse';
import type { CsvParseResult, PhysicalProgressRow, FinancialProgressRow } from '@/types/csv';

export function parseCsv<T extends PhysicalProgressRow | FinancialProgressRow>(file: File): Promise<CsvParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse<T>(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      worker: true,
      fastMode: true,
      complete: (results: ParseResult<T>) => {
        const headers = results.meta.fields ?? [];
        const rows = (results.data as T[]).slice(0);
        const errors = (results.errors as ParseError[] | undefined ?? []).map((e: ParseError) => ({ row: (e as any).row ?? -1, column: e.code, message: e.message }));
        resolve({ rows, headers, errors });
      },
    });
  });
}

export function parseCsvString<T extends PhysicalProgressRow | FinancialProgressRow>(csv: string): CsvParseResult<T> {
  const results = Papa.parse<T>(csv, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
    worker: false,
    fastMode: true,
  }) as ParseResult<T>;
  const headers = results.meta.fields ?? [];
  const rows = (results.data as T[]).slice(0);
  const errors = (results.errors as ParseError[] | undefined ?? []).map((e: ParseError) => ({ row: (e as any).row ?? -1, column: e.code, message: e.message }));
  return { rows, headers, errors };
}
