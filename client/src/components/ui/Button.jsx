import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';
import { buttonVariants } from '../../utils/buttonVariants';

const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  ...props
}, ref) => {
  const baseClasses = 'btn focus-ring';
  const variantClasses = buttonVariants.variant[variant];
  const sizeClasses = buttonVariants.size[size];
  const widthClasses = fullWidth ? 'btn-full' : '';
  const loadingClasses = loading ? 'btn-loading' : '';
  
  const classes = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    widthClasses,
    loadingClasses,
    className
  );

  const renderIcon = () => {
    if (!icon) return null;
    return <span className="btn-icon">{icon}</span>;
  };

  const content = (
    <>
      {icon && iconPosition === 'left' && renderIcon()}
      {children}
      {icon && iconPosition === 'right' && renderIcon()}
    </>
  );

  return (
    <button
      className={classes}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'outline', 'accent', 'danger', 'success']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  fullWidth: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export { Button };
export { buttonVariants } from '../../utils/buttonVariants';