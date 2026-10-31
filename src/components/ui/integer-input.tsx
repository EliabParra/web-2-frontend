import * as React from "react";
import { Input } from "./input";

/**
 * Text input that only accepts digits. A native type="number" lets browsers show
 * values like "1fd" while reporting an empty value, which hides the real mistake.
 */
const IntegerInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type">>(
  ({ onChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      onChange={(e) => {
        if (/^\d*$/.test(e.target.value)) onChange?.(e);
      }}
    />
  ),
);
IntegerInput.displayName = "IntegerInput";

export { IntegerInput };
