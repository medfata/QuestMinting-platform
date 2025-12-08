'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva(
  'relative overflow-hidden bg-white/10',
  {
    variants: {
      variant: {
        default: 'rounded-md',
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
      },
      animation: {
        pulse: 'motion-safe:animate-pulse',
        shimmer: [
          'before:absolute before:inset-0',
          'before:translate-x-[-100%]',
          'before:bg-gradient-to-r',
          'before:from-transparent before:via-white/10 before:to-transparent',
          'motion-safe:before:animate-shimmer',
        ].join(' '),
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      animation: 'shimmer',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, animation, width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, animation, className }))}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

export { Skeleton, skeletonVariants };
