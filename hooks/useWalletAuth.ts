'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';

interface AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isCheckingSession: boolean;
  address: string | null;
  error: string | null;
}

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

export function useWalletAuth() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const sessionCheckRef = useRef<string | null>(null);
  const userSignedOutRef = useRef(false); // Track if user explicitly signed out
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAuthenticating: false,
    isCheckingSession: true, // Start as true to prevent premature sign-in
    address: null,
    error: null,
  });

  // Check existing session on mount and when address changes
  useEffect(() => {
    const checkSession = async () => {
      // Prevent duplicate checks for the same address
      if (sessionCheckRef.current === address) return;
      sessionCheckRef.current = address ?? null;

      setAuthState(prev => ({ ...prev, isCheckingSession: true }));
      
      try {
        const response = await fetch('/api/auth/verify');
        const data = await response.json();
        
        if (data.authenticated && data.address) {
          // Only set authenticated if the session address matches connected wallet
          if (address && data.address.toLowerCase() === address.toLowerCase()) {
            setAuthState({
              isAuthenticated: true,
              isAuthenticating: false,
              isCheckingSession: false,
              address: data.address,
              error: null,
            });
          } else {
            // Session exists but for different wallet
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
        // Session check failed, user is not authenticated
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

  // Generate nonce for SIWE message
  const generateNonce = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Sign in with Ethereum
  const signIn = useCallback(async () => {
    if (!address || !chainId) {
      setAuthState(prev => ({
        ...prev,
        error: 'Wallet not connected',
      }));
      return false;
    }

    setAuthState(prev => ({
      ...prev,
      isAuthenticating: true,
      error: null,
    }));

    try {
      const nonce = generateNonce();
      const issuedAt = new Date().toISOString();
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Create SIWE message (EIP-4361 format)
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

      // Request signature from wallet
      const signature = await signMessageAsync({ message: messageToSign });

      // Verify signature on server
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSign,
          signature,
          address,
        }),
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
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: errorMessage,
      }));

      return false;
    }
  }, [address, chainId, signMessageAsync]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      // Mark that user explicitly signed out to prevent auto-sign-in
      userSignedOutRef.current = true;
      
      await fetch('/api/auth/verify', { method: 'DELETE' });
      
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false,
        isCheckingSession: false,
        address: null,
        error: null,
      });

      // Disconnect wallet
      disconnect();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [disconnect]);

  // Reset userSignedOut flag when wallet disconnects completely
  useEffect(() => {
    if (!isConnected) {
      userSignedOutRef.current = false;
    }
  }, [isConnected]);

  return {
    ...authState,
    isConnected,
    connectedAddress: address,
    signIn,
    signOut,
    // Computed property: ready to auto-sign-in (session checked, not authenticated, not already signing, user didn't just sign out)
    canAutoSignIn: !authState.isCheckingSession && !authState.isAuthenticated && !authState.isAuthenticating && !authState.error && !userSignedOutRef.current,
  };
}
