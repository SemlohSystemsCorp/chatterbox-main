import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const inputElement = (
      <input
        ref={ref}
        id={id}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        className={cn(
          "flex h-[48px] w-full rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-[10px] text-[16px] text-white",
          "placeholder:text-[#666]",
          "focus:border-white focus:bg-[#222] focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-[#1a1a1a] disabled:text-[#555]",
          error && "border-[#de1135] focus:border-[#de1135]",
          isPassword && "pr-10",
          className
        )}
        {...props}
      />
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-[6px] block text-[14px] font-medium text-white"
          >
            {label}
          </label>
        )}
        {isPassword ? (
          <div className="relative">
            {inputElement}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        ) : (
          inputElement
        )}
        {error && (
          <p className="mt-[6px] text-[14px] text-[#de1135]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
