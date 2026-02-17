import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  uppercase?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, uppercase, onChange, autoCapitalize, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (uppercase) {
        e.target.value = e.target.value.toUpperCase();
      }
      onChange?.(e);
    };

    // Default to sentence capitalization for short text inputs.
    // Long text fields should use <Textarea> (which defaults to autoCapitalize="none").
    const resolvedAutoCapitalize =
      autoCapitalize ??
      (type === undefined || type === "text" || type === "search" || type === "tel"
        ? "sentences"
        : "none");

    return (
      <input
        type={type}
        autoCapitalize={resolvedAutoCapitalize}
        className={cn(
          "flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors duration-150",
          uppercase && "uppercase",
          className,
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };