import React from 'react';
import { Header } from './Header';
import { MetricCard } from './MetricCard';
import { CircularGauge } from './CircularGauge';
import { CategoryCard } from './CategoryCard';
import { Charts } from './Charts';
import { Activity, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-4 md:p-8 selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* Background glowing effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
        <Header />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard title="TOTAL TEST CASES" value="1,248" icon={Activity} color="blue" />
          <MetricCard title="ASSERTIONS PASSED" value="5,892" icon={CheckCircle} color="green" />
          <MetricCard title="ASSERTIONS FAILED" value="14" icon={AlertTriangle} color="red" />
          <MetricCard title="VERIFICATION RATE" value="98.9%" icon={ShieldCheck} color="cyan" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1">
            <CircularGauge value={100} label="Readiness Rate" />
          </div>
          
          <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-colors duration-500">
            {/* Subtle highlight effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <ShieldCheck className="text-cyan-400 w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
                Verify Status by Category
              </h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CategoryCard title="Unit Testing" count="250/250" score={100} status="PERFECT" />
              <CategoryCard title="Functional Testing" count="420/420" score={100} status="PERFECT" />
              <CategoryCard title="UI/UX" count="156/156" score={100} status="PERFECT" />
              <CategoryCard title="Validation" count="89/89" score={100} status="PERFECT" />
              <CategoryCard title="Security" count="124/124" score={100} status="PERFECT" />
              <CategoryCard title="API Testing" count="209/209" score={100} status="PERFECT" />
            </div>
          </div>
        </div>

        <Charts />
      </div>
    </div>
  );
}
