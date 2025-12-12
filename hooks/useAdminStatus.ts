'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWalletAuth } from './useWalletAuth';

interface AdminStatus {
  isAdmin: boolean;
  isChecking: boolean;
  error: string | null;
}

/**
 * Hook to check if the connected wallet has admin privileges.
 * Triggers when authentication state changes.
 */
export function useAdminStatus() {
  const { isAuthenticated, connectedAddress } = useWalletAuth();
  const [status, setStatus] = useState<AdminStatus>({
    isAdmin: false,
    isChecking: false,
    error: null,
  });
  
  // Track the last checked combination of address + auth state to prevent duplicate requests
  const lastCheckedRef = useRef<string | null>(null);

  const checkAdmin = useCallback(async (address: string) => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const response = await fetch('/api/auth/admin');
      const data = await response.json();
      
      setStatus({
        isAdmin: data.isAdmin === true,
        isChecking: false,
        error: null,
      });
    } catch {
      setStatus({
        isAdmin: false,
        isChecking: false,
        error: 'Failed to check admin status',
      });
    }
  }, []);

  useEffect(() => {
    // Reset if not authenticated or no address
    if (!isAuthenticated || !connectedAddress) {
      lastCheckedRef.current = null;
      setStatus({ isAdmin: false, isChecking: false, error: null });
      return;
    }

    // Create a unique key combining auth state and address
    const checkKey = `${isAuthenticated}-${connectedAddress.toLowerCase()}`;

    // Skip if we already checked this exact combination
    if (lastCheckedRef.current === checkKey) {
      return;
    }

    // Mark as checked before making the request to prevent race conditions
    lastCheckedRef.current = checkKey;
    checkAdmin(connectedAddress);
  }, [isAuthenticated, connectedAddress, checkAdmin]);

  return status;
}
