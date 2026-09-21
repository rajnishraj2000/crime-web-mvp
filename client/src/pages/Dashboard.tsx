import { useEffect, useState } from 'react';
import { Briefcase, Users, GitBranch, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatsCard from '../components/StatsCard';
import { getCases, getStats, seedData } from '../services/api';
import { Case, StatsData } from '../types';

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const fetchedCases = await getCases();
      setCases(fetchedCases);
      
      if (fetchedCases.length > 0) {
        // Fetch stats for the first case as an example, or could aggregate
        const caseStats = await getStats(fetchedCases[0].id);
        setStats(caseStats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    await seedData();
    await loadData();
  };

  const riskData = stats?.riskDistribution ? Object.entries(stats.riskDistribution).map(([name, value]) => ({ name, value })) : [];
  const riskColors: Record<string, string> = {
    'HIGH': '#ef4444',
    'MEDIUM': '#f59e0b',
    'LOW': '#10b981'
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Loading intelligence data...</div>;
  }

  if (cases.length === 0) {
    return (
      <div className="p-4 md:p-8 h-full flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-800/50 p-6 md:p-8 rounded-xl border border-slate-700/50 text-center mx-4">
          <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-cyan-500 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Welcome to CrimeWebAI</h2>
          <p className="text-slate-400 mb-6 text-sm md:text-base">No active cases found. Get started by seeding the demo intelligence data.</p>
          <button
            onClick={handleSeed}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Seed Demo Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto scrollbar-subtle">
      <div className="mb-6 md:mb-8 ml-10 md:ml-0">
        <h1 className="text-xl md:text-2xl font-bold text-white">Intelligence Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">Overview of active investigations and network metrics.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatsCard
          title="Active Cases"
          value={cases.length}
          icon={<Briefcase className="w-6 h-6 text-cyan-400" />}
          color="cyan"
        />
        <StatsCard
          title="Entities Tracked"
          value={stats ? Object.values(stats.entityCounts).reduce((a, b) => a + b, 0) : 0}
          icon={<Users className="w-6 h-6 text-emerald-400" />}
          color="emerald"
        />
        <StatsCard
          title="Relationships Mapped"
          value={stats?.totalRelationships || 0}
          icon={<GitBranch className="w-6 h-6 text-amber-400" />}
          color="amber"
        />
        <StatsCard
          title="High Risk Suspects"
          value={stats?.riskDistribution['HIGH'] || 0}
          icon={<AlertTriangle className="w-6 h-6 text-red-400" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Investigations</h2>
          <div className="grid grid-cols-1 gap-4">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/case/${c.id}`)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-5 hover:border-cyan-500/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="text-base md:text-lg font-medium text-white group-hover:text-cyan-400 transition-colors">{c.title}</h3>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded flex-shrink-0">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3 md:mb-4 line-clamp-2">{c.description}</p>
                <div className="flex gap-3 md:gap-4 text-xs font-medium text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.entityCount || 0} Entities</span>
                  <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> {c.relationshipCount || 0} Links</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6 h-72 md:h-96 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">Risk Distribution</h2>
          <div className="flex-1 w-full min-h-0">
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={riskColors[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No risk data available</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {riskData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColors[entry.name] || '#64748b' }}></div>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
