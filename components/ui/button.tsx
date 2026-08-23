import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        secondary:
          'rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'rounded-lg border border-border bg-transparent text-foreground hover:bg-surface-elevated',
        ghost:
          'rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
        danger:
          'rounded-lg bg-danger text-white shadow-sm hover:bg-danger/90',
        link:
          'text-primary underline-offset-4 hover:underline hover:text-primary/80',
      },
      size: {
        xs: 'h-9 px-3 text-xs',
        sm: 'h-10 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
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
