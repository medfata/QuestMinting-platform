'use client';

import { ReactNode } from 'react';
import { PublicLoadingProvider } from '@/components/layout';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <PublicLoadingProvider>{children}</PublicLoadingProvider>;
}
