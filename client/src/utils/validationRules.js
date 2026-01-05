export const validationRules = {
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
    if (value && !/^\+?[\d\s\-()]+$/.test(value)) {
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