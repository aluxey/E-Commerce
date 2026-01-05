import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';
import { badgeVariants } from '../../utils/badgeVariants';

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

export { Badge };