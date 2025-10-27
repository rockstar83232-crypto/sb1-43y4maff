import React, { useEffect, useState } from 'react';
import { supabase, ESGIndicator } from '../lib/supabase';
import { Activity } from 'lucide-react';

interface ESGHeatmapProps {
  companyId: string;
}

export default function ESGHeatmap({ companyId }: ESGHeatmapProps) {
  const [indicators, setIndicators] = useState<ESGIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIndicators();
  }, [companyId]);

  const loadIndicators = async () => {
    try {
      const { data, error } = await supabase
        .from('esg_indicators')
        .select('*')
        .eq('company_id', companyId)
        .order('extracted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setIndicators(data || []);
    } catch (error) {
      console.error('Error loading indicators:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryData = () => {
    const categories = {
      environmental: indicators.filter(i => i.category === 'environmental'),
      social: indicators.filter(i => i.category === 'social'),
      governance: indicators.filter(i => i.category === 'governance'),
    };

    return Object.entries(categories).map(([category, items]) => {
      const avgCredibility = items.length > 0
        ? items.reduce((sum, i) => sum + (i.credibility_score || 0), 0) / items.length
        : 0;

      const avgSentiment = items.length > 0
        ? items.reduce((sum, i) => sum + (i.sentiment || 0), 0) / items.length
        : 0;

      return {
        category,
        count: items.length,
        credibility: avgCredibility,
        sentiment: avgSentiment,
        subcategories: getSubcategoryData(items),
      };
    });
  };

  const getSubcategoryData = (indicators: ESGIndicator[]) => {
    const subcategories = new Map<string, ESGIndicator[]>();

    indicators.forEach(indicator => {
      const existing = subcategories.get(indicator.subcategory) || [];
      subcategories.set(indicator.subcategory, [...existing, indicator]);
    });

    return Array.from(subcategories.entries()).map(([subcategory, items]) => {
      const avgCredibility = items.reduce((sum, i) => sum + (i.credibility_score || 0), 0) / items.length;
      return {
        name: subcategory.replace(/_/g, ' '),
        count: items.length,
        credibility: avgCredibility,
      };
    });
  };

  const getHeatmapColor = (credibility: number) => {
    if (credibility >= 0.8) return 'bg-emerald-500';
    if (credibility >= 0.6) return 'bg-green-400';
    if (credibility >= 0.4) return 'bg-amber-400';
    if (credibility >= 0.2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const categoryData = getCategoryData();

  if (loading) {
    return (
      <div className="glass-effect-light rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700/50 rounded w-1/3"></div>
          <div className="h-64 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect-light rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">ESG Indicator Heatmap</h2>
      </div>

      <div className="space-y-6">
        {categoryData.map(({ category, count, credibility, subcategories }) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                {category}
              </h3>
              <span className="text-xs text-slate-400">{count} indicators</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {subcategories.slice(0, 9).map((sub) => (
                <div
                  key={sub.name}
                  className="relative group"
                  title={`${sub.name}: ${(sub.credibility * 100).toFixed(0)}% credibility`}
                >
                  <div
                    className={`${getHeatmapColor(sub.credibility)} rounded-lg p-3 transition-transform hover:scale-105`}
                  >
                    <div className="text-xs font-medium text-white truncate">
                      {sub.name}
                    </div>
                    <div className="text-xs text-white opacity-90 mt-1">
                      {sub.count} items
                    </div>
                  </div>

                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-950 border border-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {sub.name}: {(sub.credibility * 100).toFixed(0)}% credibility
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300">Credibility Scale:</span>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-red-400 rounded"></div>
              <span className="text-slate-400">Low</span>
            </div>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-amber-400 rounded"></div>
              <span className="text-slate-500">Medium</span>
            </div>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <span className="text-slate-500">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
