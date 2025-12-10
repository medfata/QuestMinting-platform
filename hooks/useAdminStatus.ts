'use client';

import { useState, useEffect, useRef } from 'react';
import { useWalletAuth } from './useWalletAuth';

interface AdminStatus {
  isAdmin: boolean;
  isChecking: boolean;
  error: string | null;
}

/**
 * Hook to check if the connected wallet has admin privileges.
 * Only triggers on wallet connect and init - no duplicate requests.
 */
export function useAdminStatus() {
  const { isAuthenticated, connectedAddress } = useWalletAuth();
  const [status, setStatus] = useState<AdminStatus>({
    isAdmin: false,
    isChecking: false,
    error: null,
  });
  
  // Track the last checked address to prevent duplicate requests
  const lastCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset if not authenticated or no address
    if (!isAuthenticated || !connectedAddress) {
      lastCheckedRef.current = null;
      setStatus({ isAdmin: false, isChecking: false, error: null });
      return;
    }

    // Skip if we already checked this address
    if (lastCheckedRef.current === connectedAddress.toLowerCase()) {
      return;
    }

    const checkAdmin = async () => {
      setStatus(prev => ({ ...prev, isChecking: true, error: null }));
      
      try {
        const response = await fetch('/api/auth/admin');
        const data = await response.json();
        
        // Mark this address as checked
        lastCheckedRef.current = connectedAddress.toLowerCase();
        
        setStatus({
          isAdmin: data.isAdmin === true,
          isChecking: false,
          error: null,
        });
      } catch {
        lastCheckedRef.current = connectedAddress.toLowerCase();
        setStatus({
          isAdmin: false,
          isChecking: false,
          error: 'Failed to check admin status',
        });
      }
    };

    checkAdmin();
  }, [isAuthenticated, connectedAddress]);

  return status;
}
