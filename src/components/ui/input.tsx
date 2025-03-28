import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    // Wenn der Typ "number" ist, verwenden wir stattdessen "text" mit inputmode="numeric"
    const inputType = type === "number" ? "text" : type;
    const inputProps = type === "number" 
      ? { ...props, inputMode: "numeric" as React.HTMLAttributes<HTMLInputElement>["inputMode"], pattern: "[0-9]*[.]?[0-9]*" } 
      : props;

    return (
      <input
        type={inputType}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          type === "number" && "appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-textfield]:appearance-none text-center",
          className
        )}
        ref={ref}
        {...inputProps}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
