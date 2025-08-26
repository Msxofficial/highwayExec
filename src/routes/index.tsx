import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '@/store/useDataStore';
import { UploadCloud, Database, ChevronRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const loadSamples = useDataStore((s) => s.loadSamples);
  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10">
      <section
        className="relative mb-8 rounded-2xl overflow-hidden border"
        style={{ backgroundImage: "url('/hero-highway.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        aria-label="Highway background hero"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-sky-900/20" />
        <div className="relative p-8 md:p-14 text-white">
          <h1 className="text-3xl md:text-4xl font-semibold flex items-center gap-3">
            <Database className="text-sky-300" size={28} /> HighwayExec
          </h1>
          <p className="mt-3 text-slate-200 max-w-2xl">Upload CSVs, validate, visualize KPIs, and build executive summaries — fast.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={async () => {
                await loadSamples();
                navigate('/dashboard');
              }}
            >
              <Database size={16}/> Use sample data
            </button>
            <Link to="/review" className="inline-flex items-center rounded-lg px-4 py-2 border border-white/30 hover:bg-white/10 gap-2 backdrop-blur">
              <UploadCloud size={16}/> Upload your CSVs <ChevronRight size={16}/>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
