'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground',
        secondary:
          'bg-secondary text-secondary-foreground',
        glass:
          'bg-white/10 backdrop-blur-md border border-white/20 text-foreground',
        outline:
          'border border-primary text-primary bg-transparent',
        glow:
          'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]',
        'glow-secondary':
          'bg-secondary/20 text-secondary border border-secondary/30 shadow-[0_0_10px_rgba(var(--secondary-rgb),0.3)]',
        'glow-accent':
          'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]',
        destructive:
          'bg-destructive text-destructive-foreground',
        success:
          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        warning:
          'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
