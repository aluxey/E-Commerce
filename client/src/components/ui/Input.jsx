import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';
import { inputVariants } from '../../utils/inputVariants';

const Input = React.forwardRef(({
  className,
  type = 'text',
  variant = 'default',
  size = 'md',
  state = 'default',
  disabled = false,
  error,
  label,
  placeholder,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const baseClasses = 'input';
  const variantClasses = inputVariants.variant[variant];
  const sizeClasses = inputVariants.size[size];
  const stateClasses = inputVariants.state[state];
  const errorClasses = error ? 'input-error' : '';
  
  const classes = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    stateClasses,
    errorClasses,
    leftIcon && 'input-with-left-icon',
    rightIcon && 'input-with-right-icon',
    className
  );

  const renderLabel = () => {
    if (!label) return null;
    return (
      <label className="input-label">
        {label}
        {required && <span className="input-required">*</span>}
      </label>
    );
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    return <span className="input-left-icon">{leftIcon}</span>;
  };

  const renderRightIcon = () => {
    if (!rightIcon) return null;
    return <span className="input-right-icon">{rightIcon}</span>;
  };

  const renderHelperText = () => {
    if (!helperText && !error) return null;
    const message = error || helperText;
    const messageType = error ? 'error' : 'helper';
    
    return (
      <span className={`input-${messageType}-text`}>
        {message}
      </span>
    );
  };

  return (
    <div className="input-wrapper">
      {renderLabel()}
      <div className="input-container">
        {renderLeftIcon()}
        <input
          type={type}
          className={classes}
          placeholder={placeholder}
          disabled={disabled}
          ref={ref}
          {...props}
        />
        {renderRightIcon()}
      </div>
      {renderHelperText()}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'filled', 'outlined', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  state: PropTypes.oneOf(['default', 'error', 'success', 'warning']),
  disabled: PropTypes.bool,
  error: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
};

export { Input };