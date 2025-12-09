'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme';

export interface AnimatedBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'hero' | 'subtle' | 'minimal';
  showGrid?: boolean;
  showOrbs?: boolean;
}

const AnimatedBackground = React.forwardRef<HTMLDivElement, AnimatedBackgroundProps>(
  ({ className, variant = 'hero', showGrid = true, showOrbs = true, children, ...props }, ref) => {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        {/* Base gradient layer - theme aware */}
        <div
          className="absolute inset-0 transition-colors duration-500"
          style={{
            background: variant === 'hero'
              ? isLight
                ? 'linear-gradient(to bottom right, rgb(248,249,255), rgb(240,242,255), rgb(232,234,255))'
                : 'linear-gradient(to bottom right, rgb(10,10,20), rgb(15,15,25), rgb(10,10,15))'
              : undefined,
          }}
        />

        {/* Animated gradient orbs */}
        {showOrbs && (
          <>
            <div
              className={cn(
                'absolute rounded-full blur-[100px] motion-safe:animate-float',
                variant === 'hero' && 'w-[500px] h-[500px] -top-48 -left-24 bg-primary/30',
                variant === 'subtle' && 'w-[300px] h-[300px] -top-24 -left-12 bg-primary/20',
                variant === 'minimal' && 'w-[200px] h-[200px] -top-16 -left-8 bg-primary/10'
              )}
              style={{ animationDelay: '0s', animationDuration: '8s' }}
            />
            <div
              className={cn(
                'absolute rounded-full blur-[100px] motion-safe:animate-float',
                variant === 'hero' && 'w-[400px] h-[400px] top-1/2 -right-32 bg-secondary/25',
                variant === 'subtle' && 'w-[250px] h-[250px] top-1/3 -right-16 bg-secondary/15',
                variant === 'minimal' && 'w-[150px] h-[150px] top-1/4 -right-8 bg-secondary/10'
              )}
              style={{ animationDelay: '2s', animationDuration: '10s' }}
            />
            <div
              className={cn(
                'absolute rounded-full blur-[120px] motion-safe:animate-float',
                variant === 'hero' && 'w-[350px] h-[350px] -bottom-32 left-1/3 bg-accent/20',
                variant === 'subtle' && 'w-[200px] h-[200px] -bottom-16 left-1/4 bg-accent/10',
                variant === 'minimal' && 'hidden'
              )}
              style={{ animationDelay: '4s', animationDuration: '12s' }}
            />
          </>
        )}

        {/* Grid pattern overlay - theme aware */}
        {showGrid && (
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              variant === 'hero' ? (isLight ? 'opacity-[0.06]' : 'opacity-[0.05]') : (isLight ? 'opacity-[0.04]' : 'opacity-[0.03]')
            )}
            style={{
              backgroundImage: isLight
                ? `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`
                : `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        )}

        {/* Content layer */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full">{children}</div>
      </div>
    );
  }
);

AnimatedBackground.displayName = 'AnimatedBackground';

export { AnimatedBackground };
