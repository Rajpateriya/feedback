import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CustomerReviewsHub from './pages/CustomerReviewsHub';
import SubmitReview from './pages/SubmitReview';
import AdminModerationQueue from './pages/AdminModerationQueue';
import AnalyticsInsights from './pages/AnalyticsInsights';
import AutoApprovalModal from './components/AutoApprovalModal';
import Toast from './components/Toast';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('hub');
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
    <div className="min-h-screen bg-[#faf7fd] text-[#1e1333] flex flex-col selection:bg-purple-200 selection:text-purple-900 font-sans">
      
      {/* Floating Island Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Main Content Area with breathing room for floating navbar */}
      <main className="flex-1 pt-15 sm:pt-18 pb-6 w-full">
        {activeTab === 'hub' && (
          <CustomerReviewsHub
            onNavigateWrite={() => setActiveTab('submit')}
            showToast={showToast}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'submit' && (
          <SubmitReview
            onReviewSubmitted={() => {
              refreshPendingCount();
            }}
            showToast={showToast}
          />
        )}

        {activeTab === 'moderation' && (
          <AdminModerationQueue
            showToast={showToast}
            onQueueUpdated={refreshPendingCount}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsInsights
            showToast={showToast}
            onOpenConfigRules={() => setConfigModalOpen(true)}
          />
        )}
      </main>

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
