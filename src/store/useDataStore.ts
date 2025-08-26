import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProgressPoint, KPI } from '@/types/domain';
import { mockDataService } from '@/services/MockDataService';

type State = {
  projects: Project[];
  points: ProgressPoint[];
  kpi?: KPI;
  loading: boolean;
  currentSource: 'sample' | 'uploaded';
  uploadedProjects: Project[];
  uploadedPoints: ProgressPoint[];
};

type Actions = {
  loadSamples: () => Promise<void>;
  setData: (projects: Project[], points: ProgressPoint[]) => void;
  refreshKPIs: () => Promise<void>;
  switchToSample: () => Promise<void>;
  switchToUploaded: () => Promise<void>;
};

export const useDataStore = create<State & Actions>()(persist((set, get) => ({
  projects: [],
  points: [],
  kpi: undefined,
  loading: false,
  currentSource: 'sample',
  uploadedProjects: [],
  uploadedPoints: [],

  loadSamples: async () => {
    set({ loading: true });
    await mockDataService.loadSamples();
    const [projects, points, kpi] = await Promise.all([
      mockDataService.getProjects(),
      mockDataService.getPoints(),
      mockDataService.getKPIs(),
    ]);
    set({ projects, points, kpi, loading: false, currentSource: 'sample' });
  },

  setData: (projects, points) => {
    mockDataService.setData(projects, points);
    set({ projects, points, uploadedProjects: projects, uploadedPoints: points, currentSource: 'uploaded' });
    // Proactively compute KPIs for uploaded data
    mockDataService.getKPIs().then((kpi) => set({ kpi })).catch(() => {});
  },

  refreshKPIs: async () => {
    const kpi = await mockDataService.getKPIs();
    set({ kpi });
  },

  switchToSample: async () => {
    set({ loading: true });
    await mockDataService.loadSamples();
    const [projects, points, kpi] = await Promise.all([
      mockDataService.getProjects(),
      mockDataService.getPoints(),
      mockDataService.getKPIs(),
    ]);
    set({ projects, points, kpi, loading: false, currentSource: 'sample' });
  },

  switchToUploaded: async () => {
    const { uploadedProjects, uploadedPoints } = get();
    if (uploadedProjects.length === 0 && uploadedPoints.length === 0) return;
    mockDataService.setData(uploadedProjects, uploadedPoints);
    set({ projects: uploadedProjects, points: uploadedPoints, currentSource: 'uploaded' });
    const kpi = await mockDataService.getKPIs();
    set({ kpi });
  },
}), { name: 'highwayexec-data' }));
