import React, { createContext, useContext, useState, useEffect } from 'react';

const STAFF_PASSCODE = '12345';
const STORAGE_KEY = 'pulse_staff_auth';

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch (_) {
      return false;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);

  const authenticate = (inputPassword) => {
    if (String(inputPassword).trim() === STAFF_PASSCODE) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } catch (_) {}
      return { success: true };
    }
    return { success: false, error: 'Invalid passcode. Please enter the valid staff password.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  };

  const openAuthModal = (targetPath = null) => {
    setPendingPath(targetPath);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setPendingPath(null);
  };

  return (
    <StaffAuthContext.Provider
      value={{
        isAuthenticated,
        authenticate,
        logout,
        authModalOpen,
        openAuthModal,
        closeAuthModal,
        pendingPath,
        STAFF_PASSCODE,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
}
