import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'rounded-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105 hover:from-cyan-600 hover:via-cyan-700 hover:to-blue-700',
        secondary:
          'rounded-lg bg-slate-800/70 backdrop-blur-sm border border-slate-600/60 text-slate-200 shadow-md hover:bg-slate-700/80 hover:border-slate-500/70 hover:text-white hover:shadow-lg',
        outline:
          'rounded-lg border-2 border-cyan-500/50 bg-transparent text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20',
        ghost:
          'rounded-md text-slate-300 hover:bg-slate-800/60 hover:text-white',
        danger:
          'rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-600/40 hover:scale-105',
        link:
          'text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300',
      },
      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-4 text-sm',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
