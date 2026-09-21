import { EntityType } from '../types';

export default function EntityBadge({ type }: { type: EntityType | string }) {
  const styles: Record<string, string> = {
    Person: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Phone: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Account: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Location: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Organization: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Vehicle: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Event: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  const currentStyle = styles[type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${currentStyle}`}>
      {type}
    </span>
  );
}
