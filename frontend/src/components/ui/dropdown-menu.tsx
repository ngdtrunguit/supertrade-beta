// src/components/ui/dropdown-menu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  children 
}) => {
  const [open, setOpen] = useState(false);
  
  // Make the children interactable with open state
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { 
        open,
        onOpenChange: setOpen
      });
    }
    return child;
  });
  
  return (
    <div className="relative">
      {childrenWithProps}
    </div>
  );
};

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  asChild, 
  children,
  open,
  onOpenChange
}) => {
  // If asChild is true, we clone the child and add onClick
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        if (onOpenChange) {
          onOpenChange(!open);
        }
        
        // Call the original onClick if it exists
        if (children.props.onClick) {
          children.props.onClick(e);
        }
      }
    });
  }
  
  // Otherwise, wrap in a button
  return (
    <button 
      onClick={() => onOpenChange && onOpenChange(!open)}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
};

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  align = 'center', 
  sideOffset = 4,
  className, 
  children,
  open,
  onOpenChange,
  ...props 
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onOpenChange]);
  
  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  };
  
  if (!open) {
    return null;
  }
  
  return (
    <div
      ref={dropdownRef}
      className={cn(
        'absolute z-50 mt-2 min-w-[8rem] rounded-md border border-gray-200 bg-white p-1 shadow-md',
        'animate-in fade-in-80',
        alignClasses[align],
        className
      )}
      style={{ marginTop: sideOffset }}
      {...props}
    >
      {children}
    </div>
  );
};

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <button
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'hover:bg-gray-100 focus:bg-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        'px-2 py-1.5 text-sm font-semibold',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        'my-1 h-px bg-gray-200',
        className
      )}
      {...props}
    />
  );
};

export default { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
};