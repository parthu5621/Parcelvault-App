import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'cyan' | 'orange';
}

export function MetricCard({ title, value, icon: Icon, color = 'blue' }: MetricCardProps) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    green: 'text-green-400 bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]',
    red: 'text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]',
  };

  const bgBorder = colorMap[color];

  return (
    <div className="relative p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 overflow-hidden group hover:border-slate-600 transition-all duration-500 shadow-xl">
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-slate-400 text-xs font-bold tracking-widest mb-3 uppercase">{title}</p>
          <p className="text-5xl font-black text-slate-50 tracking-tight drop-shadow-md">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl ${bgBorder} group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
      <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-30 ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : 'bg-cyan-500'}`} />
      
      {/* Glossy overlay top */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-3xl" />
    </div>
  );
}
