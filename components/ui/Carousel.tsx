'use client';

import { useState, useCallback, useEffect, HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CarouselProps extends HTMLAttributes<HTMLDivElement> {
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  /** Enable fade transition instead of slide */
  fadeTransition?: boolean;
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      className = '',
      autoPlay = true,
      autoPlayInterval = 5000,
      showDots = true,
      showArrows = true,
      fadeTransition = false,
      children,
      ...props
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Convert children to array for counting
    const items = Array.isArray(children) ? children : [children];
    const itemCount = items.filter(Boolean).length;

    const goToNext = useCallback(() => {
      if (itemCount <= 1 || isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev + 1) % itemCount);
      setTimeout(() => setIsTransitioning(false), 500);
    }, [itemCount, isTransitioning]);

    const goToPrev = useCallback(() => {
      if (itemCount <= 1 || isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev - 1 + itemCount) % itemCount);
      setTimeout(() => setIsTransitioning(false), 500);
    }, [itemCount, isTransitioning]);

    const goToSlide = useCallback((index: number) => {
      if (isTransitioning || index === currentIndex) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 500);
    }, [isTransitioning, currentIndex]);


    // Auto-play functionality
    useEffect(() => {
      if (!autoPlay || isHovered || itemCount <= 1) return;

      const interval = setInterval(goToNext, autoPlayInterval);
      return () => clearInterval(interval);
    }, [autoPlay, autoPlayInterval, isHovered, goToNext, itemCount]);

    if (itemCount === 0) return null;

    return (
      <div
        ref={ref}
        className={cn('relative w-full overflow-hidden', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Slides Container */}
        {fadeTransition ? (
          // Fade transition mode
          <div className="relative w-full">
            {items.filter(Boolean).map((child, index) => (
              <div
                key={index}
                className={cn(
                  'w-full transition-all duration-500 ease-out',
                  index === currentIndex
                    ? 'relative opacity-100'
                    : 'absolute inset-0 opacity-0 pointer-events-none'
                )}
              >
                {child}
              </div>
            ))}
          </div>
        ) : (
          // Slide transition mode (default)
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {items.filter(Boolean).map((child, index) => (
              <div key={index} className="w-full flex-shrink-0">
                {child}
              </div>
            ))}
          </div>
        )}

        {/* Navigation Arrows - Clean Minimal Design */}
        {showArrows && itemCount > 1 && (
          <>
            <button
              onClick={goToPrev}
              disabled={isTransitioning}
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 z-10',
                'h-10 w-10 rounded-full flex items-center justify-center',
                'bg-black/40 backdrop-blur-sm',
                'text-white/80 hover:text-white hover:bg-black/60',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
              aria-label="Previous slide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              disabled={isTransitioning}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 z-10',
                'h-10 w-10 rounded-full flex items-center justify-center',
                'bg-black/40 backdrop-blur-sm',
                'text-white/80 hover:text-white hover:bg-black/60',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
              aria-label="Next slide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator - Futuristic Design */}
        {showDots && itemCount > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-10" role="tablist" aria-label="Carousel navigation">
            {items.filter(Boolean).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                role="tab"
                aria-selected={index === currentIndex}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed',
                  index === currentIndex
                    ? 'w-8 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Progress bar for auto-play */}
        {autoPlay && itemCount > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <div
              className={cn(
                'h-full bg-gradient-to-r from-primary to-secondary',
                isHovered ? 'animate-none' : 'motion-safe:animate-carousel-progress'
              )}
              style={{
                animationDuration: `${autoPlayInterval}ms`,
                animationIterationCount: 'infinite',
              }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    );
  }
);

Carousel.displayName = 'Carousel';
