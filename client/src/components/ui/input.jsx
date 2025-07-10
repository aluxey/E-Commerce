// src/components/ui/input.jsx
import React from 'react';
import classNames from 'classnames';

export const Input = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  name,
  className = '',
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`input ${className}`}
    />
  );
};

