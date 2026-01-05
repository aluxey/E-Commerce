import React, { useState, useEffect, forwardRef } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

/* Floating Label Input */
const FloatingLabelInput = forwardRef(({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  type = 'text',
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(value && value.length > 0);
  }, [value]);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    if (onChange) onChange(e);
  };

  const labelShouldFloat = isFocused || hasValue || placeholder;
  const hasError = error && error.length > 0;

  return (
    <div className={cn('floating-input', hasError && 'floating-input-error', className)}>
      <div className="floating-input-wrapper">
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'floating-input-field',
            icon && `floating-input-with-${iconPosition}-icon`,
            hasError && 'floating-input-field-error'
          )}
          {...props}
        />
        {label && (
          <label
            className={cn(
              'floating-input-label',
              labelShouldFloat && 'floating-input-label-float',
              isFocused && 'floating-input-label-focused',
              hasError && 'floating-input-label-error',
              required && 'floating-input-label-required'
            )}
          >
            {label}
          </label>
        )}
        {icon && (
          <span className={cn('floating-input-icon', `floating-input-icon-${iconPosition}`)}>
            {icon}
          </span>
        )}
      </div>
      {(helperText || hasError) && (
        <div className={cn('floating-input-helper', hasError && 'floating-input-helper-error')}>
          {hasError ? error : helperText}
        </div>
      )}
    </div>
  );
});

FloatingLabelInput.displayName = 'FloatingLabelInput';

/* Advanced Form Field */
const FormField = ({
  label,
  description,
  error,
  required = false,
  children,
  className = ''
}) => (
  <div className={cn('form-field', error && 'form-field-error', className)}>
    {(label || required) && (
      <div className="form-field-header">
        {label && (
          <label className="form-field-label">
            {label}
            {required && <span className="form-field-required">*</span>}
          </label>
        )}
        {description && (
          <span className="form-field-description">{description}</span>
        )}
      </div>
    )}
    <div className="form-field-content">{children}</div>
    {error && (
      <div className="form-field-error">
        <span className="form-field-error-icon"><AlertTriangle size={14} /></span>
        <span className="form-field-error-text">{error}</span>
      </div>
    )}
  </div>
);

/* Character Counter */
const CharacterCounter = ({ current, max, warningThreshold = 0.9 }) => {
  const percentage = current / max;
  const isWarning = percentage >= warningThreshold;
  const isError = current > max;

  return (
    <div className={cn(
      'character-counter',
      isWarning && 'character-counter-warning',
      isError && 'character-counter-error'
    )}>
      <span className="character-counter-current">{current}</span>
      <span className="character-counter-separator">/</span>
      <span className="character-counter-max">{max}</span>
    </div>
  );
};

/* Password Strength Indicator */
const PasswordStrength = ({ password }) => {
  const calculateStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return Math.min(strength, 4);
  };

  const strength = calculateStrength(password);
  const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['error', 'error', 'warning', 'info', 'success'];

  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={cn(
              'password-strength-bar',
              index < strength && `password-strength-bar-${strengthColors[strength]}`
            )}
          />
        ))}
      </div>
      <span className={cn(
        'password-strength-text',
        strength > 0 && `password-strength-text-${strengthColors[strength]}`
      )}>
        {strengthLevels[strength]}
      </span>
    </div>
  );
};





/* Form Steps */
const FormSteps = ({ currentStep, steps, onStepChange }) => (
  <div className="form-steps">
    <div className="form-steps-progress">
      <div 
        className="form-steps-progress-bar"
        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
      />
    </div>
    <div className="form-steps-list">
      {steps.map((step, index) => (
        <button
          key={index}
          type="button"
          className={cn(
            'form-steps-item',
            index === currentStep && 'form-steps-item-active',
            index < currentStep && 'form-steps-item-completed'
          )}
          onClick={() => onStepChange(index)}
          disabled={index > currentStep}
        >
          <div className="form-steps-item-number">
            {index < currentStep ? <Check size={16} /> : index + 1}
          </div>
          <div className="form-steps-item-content">
            <div className="form-steps-item-title">{step.title}</div>
            {step.description && (
              <div className="form-steps-item-description">{step.description}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  </div>
);

export {
  FloatingLabelInput,
  FormField,
  CharacterCounter,
  PasswordStrength,
  FormSteps,
};