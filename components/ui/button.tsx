import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'rounded-full bg-brand-green text-white shadow-lg shadow-brand-green/25 hover:shadow-xl hover:shadow-brand-green/30 hover:scale-105 hover:bg-brand-greenDark',
        secondary:
          'rounded-lg bg-gray-100 border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-200 hover:border-gray-300 hover:text-gray-900 hover:shadow-md',
        outline:
          'rounded-lg border-2 border-brand-green/50 bg-transparent text-brand-green hover:bg-brand-green/10 hover:border-brand-green hover:shadow-lg hover:shadow-brand-green/20',
        ghost:
          'rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900',
        danger:
          'rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-600/40 hover:scale-105',
        link:
          'text-brand-green underline-offset-4 hover:underline hover:text-brand-greenDark',
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
