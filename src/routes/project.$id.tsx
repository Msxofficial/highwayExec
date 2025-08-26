import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams();
  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Project {id}</h1>
        <p className="text-gray-600">Meta, milestones, cashflow, and risks will appear here.</p>
      </header>

      <div className="grid gap-6">
        <div className="card p-6">MetaCard placeholder</div>
        <div className="card p-6">MilestoneTimeline placeholder</div>
        <div className="card p-6">CashflowCard placeholder</div>
        <div className="card p-6">RiskList placeholder</div>
      </div>

      <div className="mt-6">
        <Link to="/dashboard" className="inline-flex items-center rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50">Back to Dashboard</Link>
      </div>
    </main>
  );
}
