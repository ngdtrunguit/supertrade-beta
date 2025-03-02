// src/components/ui/switch.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({ 
  className, 
  id, 
  checked,
  onChange,
  ...props 
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full',
        checked ? 'bg-blue-600' : 'bg-gray-200',
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        {...props}
      />
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </label>
  );
};

export default Switch;