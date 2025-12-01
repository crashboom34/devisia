import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/25 hover:from-cyan-700 hover:to-cyan-800 hover:shadow-xl hover:shadow-cyan-600/30 hover:-translate-y-0.5',
        primary:
          'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-cyan-700 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5',
        destructive:
          'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-600/30 hover:-translate-y-0.5',
        outline:
          'border-2 border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-slate-200 hover:bg-slate-800/80 hover:border-slate-600 hover:text-white hover:shadow-lg',
        secondary:
          'bg-slate-800 text-slate-200 border border-slate-700/50 hover:bg-slate-700 hover:border-slate-600 hover:text-white hover:shadow-lg',
        ghost:
          'text-slate-300 hover:bg-slate-800/50 hover:text-white',
        link:
          'text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300',
        success:
          'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5',
        warning:
          'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/25 hover:from-amber-700 hover:to-amber-800 hover:shadow-xl hover:shadow-amber-600/30 hover:-translate-y-0.5',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-9 rounded-md px-4 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
