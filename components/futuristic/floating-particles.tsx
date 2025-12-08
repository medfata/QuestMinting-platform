'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FloatingParticlesProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  colors?: string[];
  shapes?: ('circle' | 'square' | 'triangle')[];
  speed?: 'slow' | 'normal' | 'fast';
}

interface Particle {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
}

const DEFAULT_COLORS = ['rgb(var(--primary))', 'rgb(var(--secondary))', 'rgb(var(--accent))'];
const DEFAULT_SHAPES: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

const FloatingParticles = React.forwardRef<HTMLDivElement, FloatingParticlesProps>(
  (
    {
      className,
      count = 15,
      colors,
      shapes,
      speed = 'normal',
      ...props
    },
    ref
  ) => {
    const [particles, setParticles] = React.useState<Particle[]>([]);

    // Generate particles only on client to avoid hydration mismatch
    React.useEffect(() => {
      const speedMultiplier = speed === 'slow' ? 1.5 : speed === 'fast' ? 0.6 : 1;
      const colorsToUse = colors ?? DEFAULT_COLORS;
      const shapesToUse = shapes ?? DEFAULT_SHAPES;
      
      setParticles(
        Array.from({ length: count }, (_, i) => ({
          id: i,
          size: Math.random() * 8 + 4,
          left: Math.random() * 100,
          delay: Math.random() * 10,
          duration: (Math.random() * 10 + 15) * speedMultiplier,
          color: colorsToUse[Math.floor(Math.random() * colorsToUse.length)],
          shape: shapesToUse[Math.floor(Math.random() * shapesToUse.length)],
        }))
      );
    }, [count, colors, shapes, speed]);

    const renderShape = (particle: Particle) => {
      const baseStyle: React.CSSProperties = {
        width: particle.size,
        height: particle.size,
        backgroundColor: particle.shape !== 'triangle' ? particle.color : 'transparent',
        opacity: 0.6,
      };

      if (particle.shape === 'circle') {
        return <div style={{ ...baseStyle, borderRadius: '50%' }} />;
      }

      if (particle.shape === 'square') {
        return <div style={{ ...baseStyle, borderRadius: '2px' }} />;
      }

      if (particle.shape === 'triangle') {
        return (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${particle.size / 2}px solid transparent`,
              borderRight: `${particle.size / 2}px solid transparent`,
              borderBottom: `${particle.size}px solid ${particle.color}`,
              opacity: 0.6,
            }}
          />
        );
      }

      return null;
    };

    return (
      <div
        ref={ref}
        className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
        aria-hidden="true"
        {...props}
      >
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute motion-safe:animate-particle-float"
            style={{
              left: `${particle.left}%`,
              bottom: '-20px',
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          >
            {renderShape(particle)}
          </div>
        ))}
      </div>
    );
  }
);

FloatingParticles.displayName = 'FloatingParticles';

export { FloatingParticles };
