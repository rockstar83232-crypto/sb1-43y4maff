import React, { useEffect, useState } from 'react';
import { supabase, GreenwashingFlag, Company } from '../lib/supabase';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function GreenwashingDetection() {
  const [flags, setFlags] = useState<(GreenwashingFlag & { company?: Company })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadFlags();
  }, [filter]);

  const loadFlags = async () => {
    try {
      let query = supabase
        .from('greenwashing_flags')
        .select(`
          *,
          company:companies(*)
        `)
        .order('detected_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('resolved', filter === 'resolved');
      }

      const { data, error } = await query;

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error loading greenwashing flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (flagId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('greenwashing_flags')
        .update({ resolved: !currentStatus })
        .eq('id', flagId);

      setFlags((current) =>
        current.map((flag) =>
          flag.id === flagId ? { ...flag, resolved: !currentStatus } : flag
        )
      );
    } catch (error) {
      console.error('Error updating flag:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-700/20 text-slate-400 border-slate-700/30';
    }
  };

  const getFlagTypeIcon = (type: string) => {
    switch (type) {
      case 'INCONSISTENCY':
        return <AlertTriangle className="w-5 h-5" />;
      case 'VAGUE_CLAIM':
        return <Shield className="w-5 h-5" />;
      default:
        return <XCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="glass-effect-light rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">Greenwashing Detection</h2>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Flags</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {flags.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No Greenwashing Flags
            </h3>
            <p className="text-slate-400">
              {filter === 'all'
                ? 'No potential greenwashing has been detected yet.'
                : `No ${filter} flags found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className={`border rounded-lg p-5 transition-all ${
                  flag.resolved
                    ? 'bg-slate-800/30 border-slate-700/50 opacity-75'
                    : 'bg-slate-800/50 border-slate-600/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getSeverityColor(flag.severity)}`}>
                    {getFlagTypeIcon(flag.flag_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {flag.company?.name || 'Unknown Company'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                              flag.severity
                            )}`}
                          >
                            {flag.severity}
                          </span>
                          <span className="text-xs text-slate-500">
                            {flag.flag_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(flag.detected_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleResolved(flag.id, flag.resolved)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          flag.resolved
                            ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {flag.resolved ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            Mark Unresolved
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Mark Resolved
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-slate-300 mb-3">{flag.description}</p>

                    {flag.evidence && Object.keys(flag.evidence).length > 0 && (
                      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">
                          Evidence
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(flag.evidence).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-slate-400">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-medium text-slate-200">
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {flag.resolution_notes && (
                      <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <h4 className="text-sm font-semibold text-emerald-300 mb-1">
                          Resolution Notes
                        </h4>
                        <p className="text-sm text-emerald-200">
                          {flag.resolution_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <h3 className="font-semibold text-white mb-3">
            How Greenwashing Detection Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <h4 className="font-medium text-cyan-300 mb-2">Vague Claims</h4>
              <p className="text-sm text-cyan-200">
                Detects excessive use of generic environmental terms without
                specific metrics or evidence.
              </p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <h4 className="font-medium text-amber-300 mb-2">Inconsistencies</h4>
              <p className="text-sm text-amber-200">
                Identifies discrepancies between claims and verified data from
                third-party sources.
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <h4 className="font-medium text-purple-300 mb-2">Missing Data</h4>
              <p className="text-sm text-purple-200">
                Flags reports with insufficient evidence or lack of third-party
                verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
