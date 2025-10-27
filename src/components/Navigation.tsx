import React from 'react';
import { BarChart3, Home, Building2, Upload, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isProcessing?: boolean;
  progressPercent?: number;
}

export default function Navigation({ currentView, onViewChange, isProcessing = false, progressPercent = 0 }: NavigationProps) {
  const { signOut, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'upload', label: 'Upload Report', icon: Upload },
    { id: 'greenwashing', label: 'Greenwashing', icon: Shield },
  ];

  return (
    <nav className="glass-effect border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-emerald rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ESG Tracker</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onViewChange(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentView === id
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-slate-300">
                {user?.email}
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                currentView === id
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/50 overflow-hidden">
          <div
            className="h-full gradient-progress animate-gradient transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </nav>
  );
}
