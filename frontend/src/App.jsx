import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CustomerReviewsHub from './pages/CustomerReviewsHub';
import AdminModerationQueue from './pages/AdminModerationQueue';
import AnalyticsInsights from './pages/AnalyticsInsights';
import AutoApprovalModal from './components/AutoApprovalModal';
import StaffPasswordModal from './components/StaffPasswordModal';
import StaffGateScreen from './components/StaffGateScreen';
import Toast from './components/Toast';
import { StaffAuthProvider, useStaffAuth } from './context/StaffAuthContext';
import { api } from './api/client';

function ProtectedStaffRoute({ children, targetPath, showToast }) {
  const { isAuthenticated } = useStaffAuth();

  if (!isAuthenticated) {
    return <StaffGateScreen targetPath={targetPath} showToast={showToast} />;
  }

  return children;
}

function MainAppLayout() {
  const [pendingCount, setPendingCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const refreshPendingCount = async () => {
    try {
      const queue = await api.getModerationQueue({ tab: 'pending' });
      setPendingCount(queue.metrics?.pending_count || 0);
    } catch (_) {}
  };

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfaff] text-[#1a0f30] flex flex-col selection:bg-[#5122fe] selection:text-white font-sans">
      
      {/* Floating Island Navigation */}
      <Navbar
        pendingCount={pendingCount}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Main Content Area with Routing */}
      <main className="flex-1 pt-24 sm:pt-28 pb-12 w-full">
        <Routes>
          {/* Public Route: Feed */}
          <Route 
            path="/" 
            element={
              <CustomerReviewsHub
                showToast={showToast}
                searchQuery={searchQuery}
              />
            } 
          />
          <Route 
            path="/feed" 
            element={
              <CustomerReviewsHub
                showToast={showToast}
                searchQuery={searchQuery}
              />
            } 
          />

          {/* Protected Route: Moderation Queue (Requires password 12345) */}
          <Route 
            path="/moderation" 
            element={
              <ProtectedStaffRoute targetPath="/moderation" showToast={showToast}>
                <AdminModerationQueue
                  showToast={showToast}
                  onQueueUpdated={refreshPendingCount}
                  searchQuery={searchQuery}
                />
              </ProtectedStaffRoute>
            } 
          />

          {/* Protected Route: Analytics Dashboard (Requires password 12345) */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedStaffRoute targetPath="/analytics" showToast={showToast}>
                <AnalyticsInsights
                  showToast={showToast}
                  onOpenConfigRules={() => setConfigModalOpen(true)}
                />
              </ProtectedStaffRoute>
            } 
          />

          {/* Fallback Catch-all: Redirect to Feed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Staff Passcode Prompt Modal */}
      <StaffPasswordModal showToast={showToast} />

      {/* Auto-Approval Configuration Dialog */}
      <AutoApprovalModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        showToast={showToast}
      />

      {/* Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StaffAuthProvider>
        <MainAppLayout />
      </StaffAuthProvider>
    </BrowserRouter>
  );
}
