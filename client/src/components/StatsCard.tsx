import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'blue';
  subtitle?: string;
}

export default function StatsCard({ title, value, icon, color, subtitle }: StatsCardProps) {
  const colorMap = {
    cyan: 'border-cyan-500/30 group-hover:border-cyan-500/60 bg-cyan-500/10 text-cyan-400',
    emerald: 'border-emerald-500/30 group-hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-400',
    amber: 'border-amber-500/30 group-hover:border-amber-500/60 bg-amber-500/10 text-amber-400',
    red: 'border-red-500/30 group-hover:border-red-500/60 bg-red-500/10 text-red-400',
    purple: 'border-purple-500/30 group-hover:border-purple-500/60 bg-purple-500/10 text-purple-400',
    blue: 'border-blue-500/30 group-hover:border-blue-500/60 bg-blue-500/10 text-blue-400',
  };

  const iconStyles = colorMap[color];

  return (
    <div className={`bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700/50 transition-all duration-300 group hover:bg-slate-800/80 hover:shadow-lg hover:shadow-${color}-500/5`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 md:p-3 rounded-lg ${iconStyles} transition-colors duration-300`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 md:mt-4">
        <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</h3>
        <p className="text-xs md:text-sm font-medium text-slate-400 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}
