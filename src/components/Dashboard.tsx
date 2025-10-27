import React, { useEffect, useState } from 'react';
import { supabase, Company, ESGScore } from '../lib/supabase';
import { BarChart3, TrendingUp, AlertTriangle, Building2, Filter } from 'lucide-react';
import ESGHeatmap from './ESGHeatmap';
import ScoreTrend from './ScoreTrend';
import AlertsList from './AlertsList';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [scores, setScores] = useState<ESGScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadScores(selectedCompany);
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
      if (data && data.length > 0) {
        setSelectedCompany(data[0].id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScores = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('esg_scores')
        .select('*')
        .eq('company_id', companyId)
        .order('calculation_date', { ascending: false });

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error loading scores:', error);
    }
  };

  const filteredCompanies = companies.filter(company => {
    if (filterSector !== 'all' && company.sector !== filterSector) return false;
    return true;
  });

  const sectors = [...new Set(companies.map(c => c.sector))];
  const latestScore = scores[0];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/20';
      case 'CRITICAL': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-700/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ESG Impact Tracker</h1>
          <p className="text-slate-400">Real-time AI-powered ESG performance analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-effect-light rounded-xl border border-slate-700/50 p-6 transition-all duration-300 hover:border-emerald-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Company Selection</h2>
              <div className="flex gap-2">
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Sectors</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
              {filteredCompanies.map(company => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    selectedCompany === company.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Building2 className={`w-5 h-5 mt-1 ${selectedCompany === company.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{company.name}</h3>
                      <p className="text-sm text-slate-400">{company.sector}</p>
                      {company.ticker_symbol && (
                        <p className="text-xs text-slate-500 mt-1">{company.ticker_symbol}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-effect-light rounded-xl border border-slate-700/50 p-6 transition-all duration-300 hover:border-cyan-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
            {latestScore ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
                  <div className="text-sm text-slate-400 mb-1">Overall Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(latestScore.overall_score)}`}>
                    {latestScore.overall_score}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(latestScore.calculation_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Environmental</span>
                    <span className={`font-semibold ${getScoreColor(latestScore.environmental_score)}`}>
                      {latestScore.environmental_score}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Social</span>
                    <span className={`font-semibold ${getScoreColor(latestScore.social_score)}`}>
                      {latestScore.social_score}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Governance</span>
                    <span className={`font-semibold ${getScoreColor(latestScore.governance_score)}`}>
                      {latestScore.governance_score}
                    </span>
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-lg ${getRiskColor(latestScore.risk_level)}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-semibold">{latestScore.risk_level} Risk</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No scores available yet
              </div>
            )}
          </div>
        </div>

        {selectedCompany && (
          <>
            <div className="mb-6">
              <ScoreTrend scores={scores} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ESGHeatmap companyId={selectedCompany} />
              <AlertsList companyId={selectedCompany} userId={user?.id} />
            </div>
          </>
        )}

        <div className="mt-12 glass-effect-light rounded-xl border border-slate-700/50 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Us</h2>
          <div className="text-slate-300 space-y-2">
            <p className="text-lg font-semibold text-emerald-400">Team Kaiser</p>
            <p>Made by Divyansh Thosar and Saimanikanta Pothamsetti</p>
          </div>
        </div>
      </div>
    </div>
  );
}
