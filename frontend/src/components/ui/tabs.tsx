// src/components/ui/tabs.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  defaultValue, 
  value, 
  onValueChange, 
  children,
  className 
}) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue);

  React.useEffect(() => {
    if (value) {
      setActiveTab(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setActiveTab(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  // Clone children with the active tab value
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { 
        activeValue: activeTab,
        onValueChange: handleValueChange
      });
    }
    return child;
  });

  return (
    <div className={cn("space-y-4", className)}>
      {childrenWithProps}
    </div>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

export const TabsList: React.FC<TabsListProps> = ({ 
  children, 
  className,
  activeValue,
  onValueChange
}) => {
  // Clone children to pass active state
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { 
        isActive: activeValue === child.props.value,
        onClick: () => onValueChange?.(child.props.value)
      });
    }
    return child;
  });

  return (
    <div className={cn("flex border-b", className)}>
      {childrenWithProps}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  children, 
  isActive,
  onClick,
  className
}) => {
  return (
    <button
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
        isActive 
          ? "border-blue-500 text-blue-600" 
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  activeValue?: string;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children,
  activeValue,
  className
}) => {
  const isActive = value === activeValue;

  if (!isActive) {
    return null;
  }

  return (
    <div 
      className={cn(
        "mt-4",
        className
      )}
    >
      {children}
    </div>
  );
};