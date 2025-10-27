import React, { useEffect, useState } from 'react';
import { supabase, Alert } from '../lib/supabase';
import { Bell, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface AlertsListProps {
  companyId?: string;
  userId?: string;
}

export default function AlertsList({ companyId, userId }: AlertsListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadAlerts();
      subscribeToAlerts();
    }
  }, [userId, companyId]);

  const loadAlerts = async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAlerts = () => {
    if (!userId) return;

    const channel = supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setAlerts((current) => [payload.new as Alert, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (alertId: string) => {
    try {
      await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId);

      setAlerts((current) =>
        current.map((alert) =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-red-500/30 bg-red-500/10';
      case 'WARNING':
        return 'border-amber-500/30 bg-amber-500/10';
      default:
        return 'border-cyan-500/30 bg-cyan-500/10';
    }
  };

  if (loading) {
    return (
      <div className="glass-effect-light rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700/50 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-slate-700/50 rounded"></div>
            <div className="h-20 bg-slate-700/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">Alerts & Notifications</h2>
        {alerts.filter(a => !a.read).length > 0 && (
          <span className="ml-auto px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
            {alerts.filter(a => !a.read).length} new
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No alerts yet
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 transition-all ${
                alert.read ? 'border-slate-700/50 bg-slate-800/30' : getAlertColor(alert.severity)
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm">
                      {alert.title}
                    </h3>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{alert.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    {!alert.read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
