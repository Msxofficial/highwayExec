import type { Project, ProgressPoint, KPI } from '@/types/domain';
import { computeKPIs } from './metrics';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class MockDataService {
  private projects: Project[] = [];
  private points: ProgressPoint[] = [];

  async loadSamples() {
    // In a full impl, fetch from /public/sample-data and parse.
    await delay(200);
    this.projects = [
      { id: 'P1', name: 'Sample Project 1', lengthKm: 50, state: 'MH' },
      { id: 'P2', name: 'Sample Project 2', lengthKm: 30, state: 'GJ' },
    ];
    this.points = [
      { projectId: 'P1', date: '2025-07-01', plannedPhysicalPct: 40, actualPhysicalPct: 38, cumulativePlanned: 100, cumulativeActual: 95 },
      { projectId: 'P2', date: '2025-07-01', plannedPhysicalPct: 35, actualPhysicalPct: 28, cumulativePlanned: 80, cumulativeActual: 70 },
    ];
  }

  async getProjects(): Promise<Project[]> { await delay(100); return this.projects; }
  async getPoints(): Promise<ProgressPoint[]> { await delay(100); return this.points; }
  async getKPIs(): Promise<KPI> { await delay(100); return computeKPIs(this.projects, this.points); }

  setData(projects: Project[], points: ProgressPoint[]) {
    this.projects = projects;
    this.points = points;
  }
}

export const mockDataService = new MockDataService();
