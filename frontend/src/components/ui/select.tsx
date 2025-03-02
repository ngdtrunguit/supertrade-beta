
// src/components/ui/select.tsx
import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  children, 
  value, 
  onValueChange, 
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value || placeholder || 'Select...'}
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onClick: () => {
                  onValueChange?.(child.props.value);
                  setIsOpen(false);
                }
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <div 
    className={cn(
      'w-full px-3 py-2 border border-gray-300 rounded-md',
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

export const SelectValue: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <span 
    className={cn(
      'text-gray-900',
      className
    )} 
    {...props}
  >
    {children}
  </span>
);

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <div 
    className={cn(
      'bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto',
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

export const SelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
}> = ({ value, children, ...props }) => (
  <div
    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
    {...props}
  >
    {children}
  </div>
);
