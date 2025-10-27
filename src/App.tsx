import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CompanyManagement from './components/CompanyManagement';
import ReportUpload from './components/ReportUpload';
import GreenwashingDetection from './components/GreenwashingDetection';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'companies' && <CompanyManagement />}
      {currentView === 'upload' && <ReportUpload />}
      {currentView === 'greenwashing' && <GreenwashingDetection />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
