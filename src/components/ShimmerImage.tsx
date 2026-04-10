import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ShimmerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  shimmerClassName?: string;
}

const ShimmerImage: React.FC<ShimmerImageProps> = ({
  src,
  alt,
  className,
  wrapperClassName,
  shimmerClassName,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div className={cn('relative overflow-hidden', wrapperClassName)}>
      {/* Shimmer placeholder */}
      {!isLoaded && (
        <div
          className={cn(
            'absolute inset-0 bg-surface-container-high animate-shimmer',
            shimmerClassName
          )}
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent 0%, hsl(var(--md-surface-container-lowest) / 0.6) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      {/* Actual image */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'transition-opacity duration-500 ease-in-out',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};

export default ShimmerImage;
