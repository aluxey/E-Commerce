import { useState } from 'react';

export const useFormValidation = (initialValues, validationSchema = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const setError = (field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const setTouchedField = (field, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  };

  const validateField = (field, value, schema) => {
    if (!schema[field]) return null;
    
    const rules = Array.isArray(schema[field]) ? schema[field] : [schema[field]];
    
    for (const rule of rules) {
      if (typeof rule === 'function') {
        const error = rule(value, values);
        if (error) return error;
      } else if (typeof rule === 'object' && rule.validator) {
        const error = rule.validator(value, values);
        if (error) return error;
      }
    }
    
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate all fields
    for (const field in validationSchema) {
      const error = validateField(field, values[field], validationSchema);
      if (error) {
        newErrors[field] = error;
      }
    }
    
    setErrors(newErrors);
    setTouched(Object.keys(values).reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (onSubmit) => {
    const isValid = validateForm();
    
    if (!isValid) return false;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      return true;
    } catch {
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