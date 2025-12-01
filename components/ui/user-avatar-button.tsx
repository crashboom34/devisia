import * as React from 'react';
import { cn } from '@/lib/utils';

export interface UserAvatarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  initials: string;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatarButton = React.forwardRef<HTMLButtonElement, UserAvatarButtonProps>(
  ({ initials, userName, size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative rounded-full p-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500',
          'transition-all duration-200',
          'hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
          'active:scale-95',
          className
        )}
        aria-label={userName ? `${userName} profile menu` : 'User profile menu'}
        {...props}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-slate-900',
            'font-bold text-white',
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      </button>
    );
  }
);

UserAvatarButton.displayName = 'UserAvatarButton';

export { UserAvatarButton };
