import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

const cardVariants = {
  variant: {
    default: 'card-default',
    elevated: 'card-elevated',
    outlined: 'card-outlined',
    ghost: 'card-ghost',
  },
  size: {
    sm: 'card-sm',
    md: 'card-md',
    lg: 'card-lg',
    xl: 'card-xl',
  },
  padding: {
    none: 'card-padding-none',
    sm: 'card-padding-sm',
    md: 'card-padding-md',
    lg: 'card-padding-lg',
    xl: 'card-padding-xl',
  },
};

const Card = React.forwardRef(({
  className,
  variant = 'default',
  size = 'md',
  padding = 'md',
  hoverable = false,
  clickable = false,
  selected = false,
  loading = false,
  children,
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'card';
  const variantClasses = cardVariants.variant[variant];
  const sizeClasses = cardVariants.size[size];
  const paddingClasses = cardVariants.padding[padding];
  const hoverableClasses = hoverable ? 'card-hoverable' : '';
  const clickableClasses = clickable ? 'card-clickable' : '';
  const selectedClasses = selected ? 'card-selected' : '';
  const loadingClasses = loading ? 'card-loading' : '';
  
  const classes = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    paddingClasses,
    hoverableClasses,
    clickableClasses,
    selectedClasses,
    loadingClasses,
    className
  );

  const handleClick = (e) => {
    if (clickable && onClick) {
      onClick(e);
    }
  };

  return (
    <div
      className={classes}
      ref={ref}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {loading && <div className="card-loading-overlay" />}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

Card.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  hoverable: PropTypes.bool,
  clickable: PropTypes.bool,
  selected: PropTypes.bool,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};

export { Card, cardVariants };