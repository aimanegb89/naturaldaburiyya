import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground rounded-full shadow-elevation-1 active:shadow-elevation-0",
        secondary: "bg-secondary text-secondary-foreground rounded-full shadow-elevation-1",
        outline: "border border-outline bg-transparent text-primary rounded-full active:bg-primary/8",
        ghost: "text-primary rounded-full active:bg-primary/8",
        elevated: "bg-surface-container-low text-primary rounded-full shadow-elevation-1",
        destructive: "bg-destructive text-destructive-foreground rounded-full shadow-elevation-1",
        link: "text-primary underline-offset-4 hover:underline",
        fab: "bg-primary text-primary-foreground rounded-2xl shadow-elevation-3",
        hero: "bg-primary text-primary-foreground rounded-full shadow-elevation-2",
        accent: "bg-secondary text-secondary-foreground rounded-full shadow-elevation-2",
        glass: "bg-surface-container text-foreground rounded-full border border-outline-variant shadow-elevation-1",
      },
      size: {
        sm: "h-[32px] px-[12px] text-xs",
        default: "h-[36px] px-[20px] text-sm",
        lg: "h-[44px] px-[24px] text-sm",
        icon: "h-[36px] w-[36px]",
        "icon-sm": "h-[32px] w-[32px]",
        fab: "h-[56px] w-[56px]",
        "fab-extended": "h-[56px] px-[20px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
