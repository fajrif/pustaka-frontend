import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from './input';

const PercentageInput = ({ control, name, value: propValue, onChange: propOnChange, ...props }) => {
  const formatPercentage = (value) => {
    if (!value && value !== 0) return '';
    return `${value}%`;
  };

  const parsePercentage = (value) => {
    return value.replace(/%/g, '');
  };

  // React Hook Form mode
  if (control && name) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <Input
            type="text"
            value={formatPercentage(value)}
            onChange={(e) => {
              const rawValue = parsePercentage(e.target.value);
              const numValue = rawValue === '' ? 0 : Math.min(100, Math.max(0, parseFloat(rawValue) || 0));
              onChange(numValue);
            }}
            {...props}
          />
        )}
      />
    );
  }

  // Standalone mode
  return (
    <Input
      type="text"
      value={formatPercentage(propValue)}
      onChange={(e) => {
        const rawValue = parsePercentage(e.target.value);
        const numValue = rawValue === '' ? 0 : Math.min(100, Math.max(0, parseFloat(rawValue) || 0));
        propOnChange?.(numValue);
      }}
      {...props}
    />
  );
};

export { PercentageInput };
