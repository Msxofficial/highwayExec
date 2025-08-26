import React from 'react';
import { Link } from 'react-router-dom';

export default function Settings() {
  return (
    <main className="max-w-4xl mx-auto p-6 md:p-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-gray-600">Field mappings, theme, formats, export options.</p>
      </header>

      <div className="grid gap-6">
        <div className="card p-6">Theme toggle placeholder</div>
        <div className="card p-6">Field mapping presets placeholder</div>
        <div className="card p-6">Number/currency & date format placeholder</div>
        <div className="card p-6">Data retention placeholder</div>
      </div>

      <div className="mt-6">
        <Link to="/" className="inline-flex items-center rounded-lg px-4 py-2 border border-gray-300 hover:bg-gray-50">Back</Link>
      </div>
    </main>
  );
}
