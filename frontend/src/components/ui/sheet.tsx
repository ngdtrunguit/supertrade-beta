// src/components/ui/sheet.tsx
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({ 
  open, 
  onOpenChange, 
  children, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(open || false);
  
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);
  
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  
  // Make the children interactable with open state
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { 
        open: isOpen,
        onOpenChange: handleOpenChange
      });
    }
    return child;
  });
  
  return (
    <div className={cn(className)}>
      {childrenWithProps}
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50" 
          onClick={() => handleOpenChange(false)}
        />
      )}
    </div>
  );
};

interface SheetTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SheetTrigger: React.FC<SheetTriggerProps> = ({ 
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
          onOpenChange(true);
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
      onClick={() => onOpenChange && onOpenChange(true)}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
};

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SheetContent: React.FC<SheetContentProps> = ({ 
  side = 'right', 
  className, 
  children,
  open,
  onOpenChange,
  ...props 
}) => {
  const sidePositionClasses = {
    top: 'top-0 left-0 right-0 rounded-b-lg',
    right: 'right-0 top-0 h-full',
    bottom: 'bottom-0 left-0 right-0 rounded-t-lg',
    left: 'left-0 top-0 h-full'
  };
  
  const sideAnimationClasses = {
    top: open ? 'animate-in slide-in-from-top' : 'animate-out slide-out-to-top',
    right: open ? 'animate-in slide-in-from-right' : 'animate-out slide-out-to-right',
    bottom: open ? 'animate-in slide-in-from-bottom' : 'animate-out slide-out-to-bottom',
    left: open ? 'animate-in slide-in-from-left' : 'animate-out slide-out-to-left'
  };
  
  if (!open) {
    return null;
  }
  
  return (
    <div
      className={cn(
        'fixed z-50 bg-white shadow-lg',
        'w-3/4 sm:max-w-sm',
        sidePositionClasses[side],
        sideAnimationClasses[side],
        'duration-300 ease-in-out',
        className
      )}
      {...props}
    >
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center justify-end">
          <button
            onClick={() => onOpenChange && onOpenChange(false)}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto -mx-6 px-6 py-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default { Sheet, SheetTrigger, SheetContent };