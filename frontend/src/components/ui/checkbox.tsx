// src/components/ui/checkbox.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  className, 
  id, 
  label,
  ...props 
}) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
          className
        )}
        {...props}
      />
      {label && (
        <label
          htmlFor={id}
          className="ml-2 block text-sm text-gray-900"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;