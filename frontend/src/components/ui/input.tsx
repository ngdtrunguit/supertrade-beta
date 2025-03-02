
// src/components/ui/input.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ 
  className, 
  label, 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          className
        )}
        {...props}
      />
    </div>
  );
};