'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, type CardProps } from '@/components/ui/Card';

export interface GlowCardProps extends CardProps {
  glowColor?: 'primary' | 'secondary' | 'accent' | 'custom';
  customGlowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  hoverLift?: boolean;
  pulseGlow?: boolean;
}

const glowIntensityMap = {
  low: { blur: '15px', spread: '0px', opacity: '0.15' },
  medium: { blur: '25px', spread: '5px', opacity: '0.25' },
  high: { blur: '40px', spread: '10px', opacity: '0.4' },
};

const glowColorMap = {
  primary: 'rgba(var(--primary-rgb), VAR_OPACITY)',
  secondary: 'rgba(var(--secondary-rgb), VAR_OPACITY)',
  accent: 'rgba(var(--accent-rgb), VAR_OPACITY)',
};

const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  (
    {
      className,
      glowColor = 'primary',
      customGlowColor,
      intensity = 'medium',
      hoverLift = true,
      pulseGlow = false,
      variant = 'glass',
      children,
      style,
      ...props
    },
    ref
  ) => {
    const intensityConfig = glowIntensityMap[intensity];
    
    const resolvedGlowColor =
      glowColor === 'custom' && customGlowColor
        ? customGlowColor
        : glowColorMap[glowColor as keyof typeof glowColorMap]?.replace(
            'VAR_OPACITY',
            intensityConfig.opacity
          );

    const hoverGlowColor =
      glowColor === 'custom' && customGlowColor
        ? customGlowColor
        : glowColorMap[glowColor as keyof typeof glowColorMap]?.replace(
            'VAR_OPACITY',
            String(parseFloat(intensityConfig.opacity) * 1.5)
          );

    return (
      <Card
        ref={ref}
        variant={variant}
        className={cn(
          'transition-all duration-300',
          hoverLift && 'hover:-translate-y-1',
          pulseGlow && 'motion-safe:animate-glow-pulse',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          className
        )}
        style={{
          boxShadow: `0 0 ${intensityConfig.blur} ${intensityConfig.spread} ${resolvedGlowColor}`,
          ...style,
          // @ts-expect-error CSS custom property for hover state
          '--hover-glow': `0 0 ${parseInt(intensityConfig.blur) * 1.5}px ${parseInt(intensityConfig.spread) * 1.5}px ${hoverGlowColor}`,
        }}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

GlowCard.displayName = 'GlowCard';

export { GlowCard };
