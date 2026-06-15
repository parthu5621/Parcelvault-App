import React from 'react';

interface CategoryCardProps {
  title: string;
  count: string;
  score: number;
  status: string;
}

export function CategoryCard({ title, count, score, status }: CategoryCardProps) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:bg-slate-800/80 transition-all duration-300 group relative overflow-hidden shadow-md hover:shadow-lg hover:border-slate-700 hover:-translate-y-0.5">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
      
      <div className="flex flex-col">
        <span className="text-slate-100 font-semibold text-lg tracking-tight group-hover:text-white transition-colors">{title}</span>
        <span className="text-slate-500 text-sm mt-1 font-medium">{count} Tests</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-slate-100 font-bold text-xl">{score}%</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full relative"
              style={{ width: `${score}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 w-full h-full animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
        
        <div className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.1)] group-hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-shadow">
          {status}
        </div>
      </div>
    </div>
  );
}
