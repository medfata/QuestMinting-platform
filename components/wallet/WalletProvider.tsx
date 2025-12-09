'use client';

import { ReactNode, useState, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal, useWeb3ModalTheme } from '@web3modal/wagmi/react';
import { mainnet, polygon, arbitrum, optimism, base, sepolia } from 'wagmi/chains';
import { useTheme } from '@/components/theme';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Configure supported chains
const chains = [mainnet, polygon, arbitrum, optimism, base, sepolia] as const;

// Create wagmi config
const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
});

// Initialize Web3Modal synchronously (outside component)
// This ensures the modal is ready before any component tries to use it
if (typeof window !== 'undefined' && projectId) {
  createWeb3Modal({
    wagmiConfig,
    projectId,
    themeVariables: {
      '--w3m-accent': '#3b82f6',
    },
  });
}

// Component to sync app theme with Web3Modal (only renders on client)
function Web3ModalThemeSync() {
  const { resolvedTheme } = useTheme();
  const { setThemeMode } = useWeb3ModalTheme();

  useEffect(() => {
    setThemeMode(resolvedTheme);
  }, [resolvedTheme, setThemeMode]);

  return null;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {mounted && <Web3ModalThemeSync />}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { wagmiConfig };
