import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function Header() {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 rounded-t-3xl md:rounded-3xl shadow-sm mb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Smart Pantry Management System</h1>
        <p className="text-slate-400 mt-1">E2E Automated QA Suite Analysis</p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-semibold tracking-wide text-sm">DEPLOYABLE</span>
      </div>
    </header>
  );
}
