'use client';

import dynamic from 'next/dynamic';
import { ReactNode, useEffect, useState } from 'react';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// Dynamically import ConnectButton to avoid SSR issues with Web3Modal
const ConnectButton = dynamic(
  () => import('./ConnectButton').then((mod) => mod.ConnectButton),
  { ssr: false }
);

interface WalletGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

interface AdminCheckState {
  isChecking: boolean;
  isAdmin: boolean;
  error: string | null;
}

export function WalletGuard({ 
  children, 
  requireAdmin = true,
  fallback 
}: WalletGuardProps) {
  const { isConnected, isAuthenticated, connectedAddress } = useWalletAuth();
  const [adminState, setAdminState] = useState<AdminCheckState>({
    isChecking: true,
    isAdmin: false,
    error: null,
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!requireAdmin) {
        setAdminState({ isChecking: false, isAdmin: true, error: null });
        return;
      }

      if (!isAuthenticated || !connectedAddress) {
        setAdminState({ isChecking: false, isAdmin: false, error: null });
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role')
          .eq('wallet_address', connectedAddress.toLowerCase())
          .single();

        if (error || !data) {
          setAdminState({
            isChecking: false,
            isAdmin: false,
            error: null,
          });
          return;
        }

        setAdminState({
          isChecking: false,
          isAdmin: true,
          error: null,
        });
      } catch {
        setAdminState({
          isChecking: false,
          isAdmin: false,
          error: 'Failed to verify admin status',
        });
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, connectedAddress, requireAdmin]);

  // Not connected - show connect prompt
  if (!isConnected) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              Please connect your wallet to access the admin panel.
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected but not authenticated - show sign in prompt
  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              Please sign in with your wallet to verify your identity.
            </p>
            <ConnectButton requireAuth />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Checking admin status
  if (adminState.isChecking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Error checking admin status
  if (adminState.error) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">{adminState.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not an admin
  if (requireAdmin && !adminState.isAdmin) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-yellow-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              Your wallet does not have admin access to this platform.
            </p>
            <p className="text-sm text-gray-500">
              Connected: {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}
