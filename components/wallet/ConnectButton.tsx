'use client';

import { useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { useWalletAuth } from '@/hooks/useWalletAuth';

interface ConnectButtonProps {
  className?: string;
  requireAuth?: boolean; // If true, automatically prompt for SIWE after wallet connect
}

export function ConnectButton({ className = '', requireAuth = false }: ConnectButtonProps) {
  const { open } = useWeb3Modal();
  const { isConnecting } = useAccount();
  const { 
    isConnected, 
    isAuthenticated, 
    isAuthenticating, 
    connectedAddress, 
    signIn, 
    signOut,
    error 
  } = useWalletAuth();

  // Format address for display (0x1234...5678)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Auto-trigger SIWE when wallet connects and requireAuth is true
  useEffect(() => {
    if (requireAuth && isConnected && !isAuthenticated && !isAuthenticating) {
      signIn();
    }
  }, [requireAuth, isConnected, isAuthenticated, isAuthenticating, signIn]);

  if (isConnecting || isAuthenticating) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-white opacity-70 ${className}`}
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        {isAuthenticating ? 'Signing...' : 'Connecting...'}
      </button>
    );
  }

  // Connected but not authenticated - show sign in button
  if (isConnected && connectedAddress && !isAuthenticated) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => open({ view: 'Account' })}
            className={`flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 ${className}`}
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            {formatAddress(connectedAddress)}
          </button>
          <button
            onClick={signIn}
            className="rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            title="Sign in with Ethereum"
          >
            Sign In
          </button>
        </div>
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>
    );
  }

  // Connected and authenticated
  if (isConnected && connectedAddress && isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => open({ view: 'Account' })}
          className={`flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 ${className}`}
        >
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {formatAddress(connectedAddress)}
        </button>
        <button
          onClick={signOut}
          className="rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          title="Sign out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  // Not connected
  return (
    <button
      onClick={() => open()}
      className={`rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 ${className}`}
    >
      Connect Wallet
    </button>
  );
}
