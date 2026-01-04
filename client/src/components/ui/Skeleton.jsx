import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

const skeletonVariants = {
  variant: {
    text: 'skeleton-text',
    circular: 'skeleton-circular',
    rectangular: 'skeleton-rectangular',
    rounded: 'skeleton-rounded',
  },
  size: {
    xs: 'skeleton-xs',
    sm: 'skeleton-sm',
    md: 'skeleton-md',
    lg: 'skeleton-lg',
    xl: 'skeleton-xl',
  },
  animation: {
    pulse: 'skeleton-pulse',
    wave: 'skeleton-wave',
    none: 'skeleton-none',
  },
};

const Skeleton = React.forwardRef(({
  className,
  variant = 'rectangular',
  size = 'md',
  animation = 'pulse',
  width,
  height,
  lines = 1,
  ...props
}, ref) => {
  const baseClasses = 'skeleton';
  const variantClasses = skeletonVariants.variant[variant];
  const sizeClasses = skeletonVariants.size[size];
  const animationClasses = skeletonVariants.animation[animation];
  
  const classes = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    animationClasses,
    className
  );

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-text-wrapper" ref={ref} {...props}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses,
              sizeClasses,
              animationClasses,
              'skeleton-text-line'
            )}
            style={{
              width: index === lines - 1 ? '70%' : '100%',
              ...style,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={classes}
      style={style}
      ref={ref}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['text', 'circular', 'rectangular', 'rounded']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  animation: PropTypes.oneOf(['pulse', 'wave', 'none']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lines: PropTypes.number,
};

export { Skeleton, skeletonVariants };