// src/components/ui/card.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div 
    className={cn(
      'bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden',
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ className, children, ...props }) => (
  <div 
    className={cn(
      'px-4 py-3 border-b border-gray-200',
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<CardTitleProps> = ({ className, children, ...props }) => (
  <h3 
    className={cn(
      'text-lg font-semibold text-gray-900',
      className
    )} 
    {...props}
  >
    {children}
  </h3>
);

export const CardContent: React.FC<CardContentProps> = ({ className, children, ...props }) => (
  <div 
    className={cn(
      'p-4',
      className
    )} 
    {...props}
  >
    {children}
  </div>
);