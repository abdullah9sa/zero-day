import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  inset,
}: {
  children?: ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <div className={cn("bg-paper", inset ? "bevel-in" : "bevel-out", className)}>{children}</div>
  );
}

export function RetroButton({
  className,
  active,
  plain,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; plain?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-[3px] bg-mustard px-3 py-1.5 font-sans text-xs font-extrabold text-ink transition-transform select-none",
        plain ? "border-0 shadow-none" : active ? "bevel-in translate-x-0.5 translate-y-0.5" : "bevel-out",
        !plain && "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

export function TitleBar({
  title,
  right,
  small,
  tone = "sky",
}: {
  title: string;
  right?: ReactNode;
  small?: boolean;
  tone?: "sky" | "mustard" | "coral";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b-2 border-ink px-2 text-ink",
        tone === "mustard" ? "bg-mustard" : tone === "coral" ? "bg-coral" : "bg-sky",
        small ? "min-h-8" : "min-h-10",
      )}
    >
      <span className="truncate font-sans text-xs font-black">{title}</span>
      <div className="flex items-center gap-1">
        {right}
        <span className="flex gap-0.5">
          {["○", "−", "×"].map((glyph) => (
            <span
              key={glyph}
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-paper text-xs font-bold leading-none text-ink"
            >
              {glyph}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

export function Gauge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "trust" | "panic" | "suspicion";
}) {
  const color =
    tone === "trust"
      ? "bg-terminal-green"
      : tone === "panic"
        ? "bg-alert-amber"
        : value >= 65
          ? "bg-alert-red"
          : "bg-navy-light";
  const segments = 20;
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[10px] text-os-text">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="bevel-in flex gap-px bg-paper p-1">
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={cn("h-3 flex-1 rounded-[1px]", i < filled ? color : "bg-os-dark/40")}
          />
        ))}
      </div>
    </div>
  );
}
