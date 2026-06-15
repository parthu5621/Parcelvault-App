import React from 'react';

interface CircularGaugeProps {
  value: number;
  label: string;
}

export function CircularGauge({ value, label }: CircularGaugeProps) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden h-full">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-3xl" />
      
      <h3 className="text-2xl font-bold text-slate-100 mb-8 tracking-tight">{label}</h3>
      
      <div className="relative flex items-center justify-center mb-8">
        <svg className="transform -rotate-90 w-64 h-64 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="transparent"
            className="text-slate-800"
          />
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-green-500 transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-6xl font-black text-slate-50 drop-shadow-md">{value}%</span>
          <span className="text-green-400 font-bold tracking-widest text-sm mt-2">PASS SCORE</span>
        </div>
      </div>

      <p className="text-slate-400 text-sm text-center max-w-[220px] font-medium leading-relaxed">
        Requires <span className="text-green-400 font-semibold">≥95%</span> pass score to deploy.
      </p>
    </div>
  );
}
