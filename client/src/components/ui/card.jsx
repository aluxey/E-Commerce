// src/components/ui/card.jsx
import React from 'react';
import classNames from 'classnames';

export const Card = ({ className = '', children }) => {
  return <div className={`card ${className}`}>{children}</div>;
};

export const CardContent = ({ className = '', children }) => {
  return <div className={`card-content ${className}`}>{children}</div>;
};
