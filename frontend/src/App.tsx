import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Ticketing } from './pages/Ticketing';
import { VerificationScanner } from './pages/VerificationScanner';
import { Attractions } from './pages/Attractions';
import { WaitTimePredictor } from './pages/WaitTimePredictor';
import { VisitorAnalytics } from './pages/VisitorAnalytics';
import { DemandForecasting } from './pages/DemandForecasting';
import { RevenueAnalytics } from './pages/RevenueAnalytics';
import { Recommendations } from './pages/Recommendations';
import { Reports } from './pages/Reports';
import { UserManagement } from './pages/UserManagement';
import { Login } from './pages/Login';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white font-mono text-sm">
        Initializing SmartPark AI Core Telemetry...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/ticketing"
            element={
              <ProtectedLayout>
                <Ticketing />
              </ProtectedLayout>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedLayout>
                <VerificationScanner />
              </ProtectedLayout>
            }
          />
          <Route
            path="/attractions"
            element={
              <ProtectedLayout>
                <Attractions />
              </ProtectedLayout>
            }
          />
          <Route
            path="/predictions"
            element={
              <ProtectedLayout>
                <WaitTimePredictor />
              </ProtectedLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedLayout>
                <VisitorAnalytics />
              </ProtectedLayout>
            }
          />
          <Route
            path="/forecasting"
            element={
              <ProtectedLayout>
                <DemandForecasting />
              </ProtectedLayout>
            }
          />
          <Route
            path="/revenue"
            element={
              <ProtectedLayout>
                <RevenueAnalytics />
              </ProtectedLayout>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedLayout>
                <Recommendations />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedLayout>
                <Reports />
              </ProtectedLayout>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedLayout>
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              </ProtectedLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
