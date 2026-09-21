// Risk level badge component — RED for HIGH, AMBER for MEDIUM, GREEN for LOW

export default function RiskBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' | string }) {
  const styles = {
    HIGH: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500', border: 'border-red-500/20' },
    MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500', border: 'border-amber-500/20' },
    LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/20' }
  };

  const style = styles[level as keyof typeof styles] || styles.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      {level} RISK
    </span>
  );
}
