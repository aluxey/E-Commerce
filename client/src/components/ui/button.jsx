// src/components/ui/button.jsx
import React from 'react';
import classNames from 'classnames';

export const Button = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'base',
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn ${variant} ${size} ${className}`}
    >
      {children}
    </button>
  );
};
