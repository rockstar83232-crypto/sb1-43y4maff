import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Plus, Upload } from 'lucide-react';

export default function CompanyManagement() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ticker_symbol: '',
    industry: '',
    sector: '',
    region: '',
    headquarters: '',
    website: '',
    description: '',
    employee_count: '',
    revenue_usd: '',
  });

  const industries = [
    'Technology', 'Finance', 'Healthcare', 'Energy', 'Manufacturing',
    'Retail', 'Transportation', 'Telecommunications', 'Consumer Goods',
    'Real Estate', 'Utilities', 'Agriculture', 'Mining', 'Construction'
  ];

  const sectors = [
    'Information Technology', 'Financial Services', 'Healthcare',
    'Energy', 'Industrials', 'Consumer Discretionary', 'Consumer Staples',
    'Materials', 'Real Estate', 'Utilities', 'Communication Services'
  ];

  const regions = [
    'North America', 'Europe', 'Asia Pacific', 'Latin America',
    'Middle East', 'Africa', 'Global'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.from('companies').insert({
        ...formData,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
        revenue_usd: formData.revenue_usd ? parseFloat(formData.revenue_usd) : null,
        created_by: user.id,
      }).select().single();

      if (error) throw error;

      setFormData({
        name: '',
        ticker_symbol: '',
        industry: '',
        sector: '',
        region: '',
        headquarters: '',
        website: '',
        description: '',
        employee_count: '',
        revenue_usd: '',
      });
      setShowAddForm(false);
      alert('Company added successfully!');
    } catch (error: any) {
      console.error('Error adding company:', error);
      alert('Error adding company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="glass-effect-light rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">Company Management</h2>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 gradient-emerald text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Tesla Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Ticker Symbol
                </label>
                <input
                  type="text"
                  value={formData.ticker_symbol}
                  onChange={(e) => setFormData({ ...formData, ticker_symbol: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., TSLA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Industry *
                </label>
                <select
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Sector *
                </label>
                <select
                  required
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Sector</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Region *
                </label>
                <select
                  required
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Headquarters
                </label>
                <input
                  type="text"
                  value={formData.headquarters}
                  onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Austin, Texas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Employee Count
                </label>
                <input
                  type="number"
                  value={formData.employee_count}
                  onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Revenue (USD)
                </label>
                <input
                  type="number"
                  value={formData.revenue_usd}
                  onChange={(e) => setFormData({ ...formData, revenue_usd: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., 50000000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the company..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 gradient-emerald text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Company'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!showAddForm && (
          <div className="text-center py-8 text-slate-400">
            Click "Add Company" to start tracking ESG performance
          </div>
        )}
      </div>
    </div>
  );
}
