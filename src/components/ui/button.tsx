import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border border-zinc-700 bg-white text-black hover:bg-zinc-200",
  secondary:
    "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900",
  ghost: "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
  danger:
    "border border-red-900/50 bg-red-950/20 text-red-300 hover:border-red-800 hover:bg-red-950/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-2 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    className = "",
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
});
