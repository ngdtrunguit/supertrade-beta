// src/components/ui/avatar.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Avatar: React.FC<AvatarProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ 
  className, 
  src, 
  alt = '', 
  ...props 
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'aspect-square h-full w-full object-cover',
        className
      )}
      {...props}
    />
  );
};

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default { Avatar, AvatarImage, AvatarFallback };