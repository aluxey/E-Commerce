import React, { useState, useEffect, forwardRef } from 'react';
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
        <span className="form-field-error-icon">⚠</span>
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

/* Form Validation Hook */
const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (touched[name] && validationSchema[name]) {
      const error = validationSchema[name](value, values);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const setError = (name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const setTouchedField = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    if (validationSchema[name]) {
      const error = validationSchema[name](values[name], values);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const newTouched = {};
    
    Object.keys(validationSchema).forEach(field => {
      newTouched[field] = true;
      const error = validationSchema[field](values[field], values);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (onSubmit) => {
    const isValid = validateForm();
    
    if (!isValid) return false;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setError,
    setTouchedField,
    validateForm,
    handleSubmit,
    resetForm,
  };
};

/* Validation Rules */
const validationRules = {
  required: (message = 'This field is required') => (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return message;
    }
    return null;
  },
  
  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },
  
  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },
  
  email: (message = 'Please enter a valid email address') => (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
    return null;
  },
  
  phone: (message = 'Please enter a valid phone number') => (value) => {
    if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
      return message;
    }
    return null;
  },
  
  password: (message = 'Password must be at least 8 characters') => (value) => {
    if (value && value.length < 8) {
      return message;
    }
    return null;
  },
  
  match: (fieldName, message) => (value, allValues) => {
    if (value && allValues[fieldName] && value !== allValues[fieldName]) {
      return message || `Must match ${fieldName}`;
    }
    return null;
  },
  
  regex: (pattern, message) => (value) => {
    if (value && !pattern.test(value)) {
      return message;
    }
    return null;
  },
  
  min: (min, message) => (value) => {
    if (value !== undefined && value < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  },
  
  max: (max, message) => (value) => {
    if (value !== undefined && value > max) {
      return message || `Must be no more than ${max}`;
    }
    return null;
  },
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
            {index < currentStep ? '✓' : index + 1}
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
  useFormValidation,
  validationRules,
  FormSteps,
};