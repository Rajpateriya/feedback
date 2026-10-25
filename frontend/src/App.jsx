import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CustomerReviewsHub from './pages/CustomerReviewsHub';
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
    <div className="min-h-screen bg-[#fcfaff] text-[#1a0f30] flex flex-col selection:bg-[#5122fe] selection:text-white font-sans">
      
      {/* Floating Island Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Main Content Area with generous breathing room for floating navbar */}
      <main className="flex-1 pt-24 sm:pt-28 pb-12 w-full">
        {activeTab === 'hub' && (
          <CustomerReviewsHub
            showToast={showToast}
            searchQuery={searchQuery}
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
