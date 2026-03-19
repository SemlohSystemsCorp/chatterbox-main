import { cn } from "@/utils/cn";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** Label shown below or beside the spinner */
  label?: string;
  /** Center the spinner in its container */
  center?: boolean;
  /** Use "light" on dark backgrounds (default), "dark" on light backgrounds */
  variant?: "light" | "dark";
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: "h-3.5 w-3.5 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-6 w-6 border-2",
};

const variantMap: Record<string, string> = {
  light: "border-[#333] border-t-white",
  dark: "border-black/20 border-t-black",
};

export function Spinner({ size = "md", className, label, center, variant = "light" }: SpinnerProps) {
  const spinner = (
    <div
      className={cn(
        "animate-spin rounded-full",
        variantMap[variant],
        sizeMap[size],
        className
      )}
    />
  );

  if (label) {
    return (
      <div className={cn("flex items-center gap-2", center && "justify-center")}>
        {spinner}
        <span className="text-[13px] text-[#555]">{label}</span>
      </div>
    );
  }

  if (center) {
    return (
      <div className="flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
