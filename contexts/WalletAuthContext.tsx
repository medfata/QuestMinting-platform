'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';

interface AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isCheckingSession: boolean;
  address: string | null;
  error: string | null;
}

interface WalletAuthContextValue extends AuthState {
  isConnected: boolean;
  connectedAddress: `0x${string}` | undefined;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  canAutoSignIn: boolean;
}

const WalletAuthContext = createContext<WalletAuthContextValue | null>(null);

// Create SIWE message manually (EIP-4361 format)
function createSiweMessage(params: {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}): string {
  return `${params.domain} wants you to sign in with your Ethereum account:
${params.address}

${params.statement}

URI: ${params.uri}
Version: ${params.version}
Chain ID: ${params.chainId}
Nonce: ${params.nonce}
Issued At: ${params.issuedAt}
Expiration Time: ${params.expirationTime}`;
}

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const sessionCheckRef = useRef<string | null>(null);
  const userSignedOutRef = useRef(false);
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAuthenticating: false,
    isCheckingSession: true,
    address: null,
    error: null,
  });


  // Check existing session on mount and when address changes
  useEffect(() => {
    const checkSession = async () => {
      if (sessionCheckRef.current === address) return;
      sessionCheckRef.current = address ?? null;

      setAuthState(prev => ({ ...prev, isCheckingSession: true }));
      
      try {
        const response = await fetch('/api/auth/verify');
        const data = await response.json();
        
        if (data.authenticated && data.address) {
          if (address && data.address.toLowerCase() === address.toLowerCase()) {
            setAuthState({
              isAuthenticated: true,
              isAuthenticating: false,
              isCheckingSession: false,
              address: data.address,
              error: null,
            });
          } else {
            setAuthState({
              isAuthenticated: false,
              isAuthenticating: false,
              isCheckingSession: false,
              address: null,
              error: null,
            });
          }
        } else {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
            isCheckingSession: false,
            address: null,
          }));
        }
      } catch {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          isCheckingSession: false,
          address: null,
        }));
      }
    };

    if (isConnected && address) {
      checkSession();
    } else {
      sessionCheckRef.current = null;
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false,
        isCheckingSession: false,
        address: null,
        error: null,
      });
    }
  }, [isConnected, address]);

  const generateNonce = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const signIn = useCallback(async () => {
    if (!address || !chainId) {
      setAuthState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const nonce = generateNonce();
      const issuedAt = new Date().toISOString();
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const messageToSign = createSiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Multi-Chain Mint Platform',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt,
        expirationTime,
      });

      const signature = await signMessageAsync({ message: messageToSign });

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSign, signature, address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setAuthState({
        isAuthenticated: true,
        isAuthenticating: false,
        isCheckingSession: false,
        address: data.address,
        error: null,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthState(prev => ({ ...prev, isAuthenticating: false, error: errorMessage }));
      return false;
    }
  }, [address, chainId, signMessageAsync]);

  const signOut = useCallback(async () => {
    try {
      userSignedOutRef.current = true;
      await fetch('/api/auth/verify', { method: 'DELETE' });
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false,
        isCheckingSession: false,
        address: null,
        error: null,
      });
      disconnect();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [disconnect]);

  useEffect(() => {
    if (!isConnected) {
      userSignedOutRef.current = false;
    }
  }, [isConnected]);

  const value: WalletAuthContextValue = {
    ...authState,
    isConnected,
    connectedAddress: address,
    signIn,
    signOut,
    canAutoSignIn: !authState.isCheckingSession && !authState.isAuthenticated && !authState.isAuthenticating && !authState.error && !userSignedOutRef.current,
  };

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth() {
  const context = useContext(WalletAuthContext);
  if (!context) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
}
