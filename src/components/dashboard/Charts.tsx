import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area,
  BarChart, Bar, Legend
} from 'recharts';

const passFailData = [
  { name: 'Passed', value: 95 },
  { name: 'Failed', value: 5 }
];

const coverageData = [
  { name: 'Components', uv: 85, pv: 2400, amt: 2400 },
  { name: 'Services', uv: 90, pv: 1398, amt: 2210 },
  { name: 'Hooks', uv: 88, pv: 9800, amt: 2290 },
  { name: 'Pages', uv: 95, pv: 3908, amt: 2000 },
];

const timelineData = [
  { time: '10:00', value: 2 },
  { time: '10:05', value: 5 },
  { time: '10:10', value: 3 },
  { time: '10:15', value: 8 },
  { time: '10:20', value: 12 },
  { time: '10:25', value: 7 },
  { time: '10:30', value: 4 },
];

const COLORS = ['#22c55e', '#ef4444']; // green-500, red-500

export function Charts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
      
      {/* Pass vs Fail */}
      <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all duration-300">
        <h3 className="text-slate-300 font-semibold mb-4 tracking-wide text-sm uppercase">Pass vs Fail</h3>
        <div className="h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={passFailData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {passFailData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-200">95%</span>
          </div>
        </div>
      </div>

      {/* Test Coverage */}
      <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all duration-300">
        <h3 className="text-slate-300 font-semibold mb-4 tracking-wide text-sm uppercase">Test Coverage</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coverageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
              <Tooltip 
                cursor={{ fill: '#1e293b' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              />
              <Bar dataKey="uv" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Build Success Trend */}
      <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all duration-300">
        <h3 className="text-slate-300 font-semibold mb-4 tracking-wide text-sm uppercase">Build Success Trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={coverageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              />
              <Line type="monotone" dataKey="pv" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#06b6d4' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Execution Timeline */}
      <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all duration-300">
        <h3 className="text-slate-300 font-semibold mb-4 tracking-wide text-sm uppercase">Execution Timeline</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
