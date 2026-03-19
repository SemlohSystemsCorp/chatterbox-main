"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
  /** Where the tooltip appears relative to the trigger */
  side?: "top" | "bottom" | "left" | "right";
  /** Extra delay in ms before showing (default 0) */
  delay?: number;
}

export function Tooltip({ label, children, side = "bottom", delay = 0 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  function show() {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }

  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tip = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (side) {
      case "top":
        top = trigger.top - tip.height - 6;
        left = trigger.left + trigger.width / 2 - tip.width / 2;
        break;
      case "bottom":
        top = trigger.bottom + 6;
        left = trigger.left + trigger.width / 2 - tip.width / 2;
        break;
      case "left":
        top = trigger.top + trigger.height / 2 - tip.height / 2;
        left = trigger.left - tip.width - 6;
        break;
      case "right":
        top = trigger.top + trigger.height / 2 - tip.height / 2;
        left = trigger.right + 6;
        break;
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tip.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tip.height - 8));

    setCoords({ top, left });
  }, [visible, side]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="inline-flex"
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="pointer-events-none fixed z-[9999] animate-[tooltip-in_100ms_ease-out] rounded-[6px] bg-[#1a1a1a] px-2.5 py-1.5 text-[12px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-[#2a2a2a]"
          style={coords ? { top: coords.top, left: coords.left } : { opacity: 0 }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
