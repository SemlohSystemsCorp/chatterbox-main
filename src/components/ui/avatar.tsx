"use client";

import { cn } from "@/utils/cn";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "away" | "dnd" | "offline";
  className?: string;
}

const sizeStyles = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const statusSizeStyles = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
  xl: "h-4 w-4",
};

const statusColors = {
  online: "bg-green-500",
  away: "bg-amber-500",
  dnd: "bg-red-500",
  offline: "bg-zinc-400",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "bg-zinc-900",
  "bg-zinc-700",
  "bg-zinc-600",
  "bg-zinc-500",
  "bg-zinc-800",
  "bg-black",
  "bg-zinc-950",
  "bg-zinc-400",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function Avatar({
  src,
  name,
  size = "md",
  status,
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            "rounded-full object-cover",
            sizeStyles[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full font-semibold text-white",
            sizeStyles[size],
            getColorFromName(name)
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-black",
            statusSizeStyles[size],
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
}
