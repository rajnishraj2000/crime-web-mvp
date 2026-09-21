import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import CaseView from './pages/CaseView';
import UploadReport from './pages/UploadReport';
import AuditTrail from './pages/AuditTrail';
import LoginPage from './pages/LoginPage';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();

  // Show a loading spinner while Firebase checks the auth session
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Gate: if not authenticated, show login page
  if (!user) {
    return <LoginPage />;
  }

  // Authenticated: show the main app
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/case/:id" element={<CaseView />} />
        <Route path="/upload" element={<UploadReport />} />
        <Route path="/audit/:caseId" element={<AuditTrail />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
