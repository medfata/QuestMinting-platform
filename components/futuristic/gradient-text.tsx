'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type GradientTextElement = 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

export interface GradientTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: GradientTextElement;
  colors?: string[];
  animate?: boolean;
  animationDuration?: number;
}

const GradientText = React.forwardRef<HTMLElement, GradientTextProps>(
  (
    {
      className,
      as: Component = 'span',
      colors = ['rgb(var(--primary))', 'rgb(var(--secondary))', 'rgb(var(--accent))'],
      animate = true,
      animationDuration = 5,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const gradientStyle: React.CSSProperties = {
      background: `linear-gradient(135deg, ${colors.join(', ')})`,
      backgroundSize: animate ? '200% 200%' : '100% 100%',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      animationDuration: `${animationDuration}s`,
      ...style,
    };

    return (
      <Component
        ref={ref as React.Ref<never>}
        className={cn(animate && 'motion-safe:animate-gradient-shift', className)}
        style={gradientStyle}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

GradientText.displayName = 'GradientText';

export { GradientText };
