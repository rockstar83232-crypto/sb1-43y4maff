import React from 'react';
import { ESGScore } from '../lib/supabase';
import { TrendingUp } from 'lucide-react';

interface ScoreTrendProps {
  scores: ESGScore[];
}

export default function ScoreTrend({ scores }: ScoreTrendProps) {
  if (scores.length === 0) {
    return (
      <div className="glass-effect-light rounded-xl border border-slate-700/50 p-6">
        <div className="text-center py-8 text-slate-400">
          No score history available
        </div>
      </div>
    );
  }

  const sortedScores = [...scores].reverse();
  const maxScore = 100;
  const categories = ['environmental', 'social', 'governance'];

  const getCategoryScore = (score: ESGScore, category: string) => {
    switch (category) {
      case 'environmental': return score.environmental_score;
      case 'social': return score.social_score;
      case 'governance': return score.governance_score;
      default: return 0;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'rgb(16, 185, 129)';
      case 'social': return 'rgb(6, 182, 212)';
      case 'governance': return 'rgb(168, 85, 247)';
      default: return 'rgb(148, 163, 184)';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-semibold text-white">ESG Score Trends</h2>
      </div>

      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 800 200">
          <defs>
            {categories.map((category, idx) => (
              <linearGradient
                key={category}
                id={`gradient-${category}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={getCategoryColor(category)} stopOpacity="0.2" />
                <stop offset="100%" stopColor={getCategoryColor(category)} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {[0, 25, 50, 75, 100].map((value) => (
            <g key={value}>
              <line
                x1="50"
                y1={200 - (value * 2)}
                x2="750"
                y2={200 - (value * 2)}
                stroke="#475569"
                strokeWidth="1"
              />
              <text
                x="30"
                y={205 - (value * 2)}
                fill="#94a3b8"
                fontSize="12"
                textAnchor="middle"
              >
                {value}
              </text>
            </g>
          ))}

          {categories.map((category) => {
            const points = sortedScores.map((score, index) => {
              const x = 50 + (index * (700 / Math.max(sortedScores.length - 1, 1)));
              const y = 200 - (getCategoryScore(score, category) * 2);
              return `${x},${y}`;
            }).join(' ');

            const areaPoints = `50,200 ${points} ${50 + (700 / Math.max(sortedScores.length - 1, 1)) * (sortedScores.length - 1)},200`;

            return (
              <g key={category}>
                <polyline
                  points={areaPoints}
                  fill={`url(#gradient-${category})`}
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke={getCategoryColor(category)}
                  strokeWidth="2"
                />
                {sortedScores.map((score, index) => {
                  const x = 50 + (index * (700 / Math.max(sortedScores.length - 1, 1)));
                  const y = 200 - (getCategoryScore(score, category) * 2);
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill={getCategoryColor(category)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {categories.map((category) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getCategoryColor(category) }}
            ></div>
            <span className="text-sm text-slate-300 capitalize">
              {category}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex justify-between text-xs text-slate-400">
          {sortedScores.length > 0 && (
            <>
              <span>{new Date(sortedScores[0].calculation_date).toLocaleDateString()}</span>
              <span>{new Date(sortedScores[sortedScores.length - 1].calculation_date).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
