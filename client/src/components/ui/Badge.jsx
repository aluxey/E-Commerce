import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

const badgeVariants = {
  variant: {
    default: 'badge-default',
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
    accent: 'badge-accent',
  },
  size: {
    xs: 'badge-xs',
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg',
  },
  shape: {
    pill: 'badge-pill',
    rounded: 'badge-rounded',
    square: 'badge-square',
  },
};

const Badge = React.forwardRef(({
  className,
  variant = 'default',
  size = 'md',
  shape = 'rounded',
  children,
  ...props
}, ref) => {
  const baseClasses = 'badge';
  const variantClasses = badgeVariants.variant[variant];
  const sizeClasses = badgeVariants.size[size];
  const shapeClasses = badgeVariants.shape[shape];
  
  const classes = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    shapeClasses,
    className
  );

  return (
    <span className={classes} ref={ref} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

Badge.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info', 'accent']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  shape: PropTypes.oneOf(['pill', 'rounded', 'square']),
  children: PropTypes.node.isRequired,
};

export { Badge, badgeVariants };