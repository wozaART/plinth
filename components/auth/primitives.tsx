import type React from "react";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] tracking-[.14em] uppercase text-text-eyebrow">
      {children}
    </div>
  );
}

export function AuthHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={`font-serif font-medium tracking-[-0.02em] leading-[1.08] mt-[9px] ${className}`}
      style={{ fontSize: "clamp(28px,3.4vw,36px)" }}
    >
      {children}
    </h1>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12.5px] font-[550] text-foreground">
      {children}
    </label>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full border border-border-input bg-surface rounded-[var(--pl-radius-input)] px-[14px] py-3 font-sans text-[14px] text-foreground mt-[6px]"
      {...props}
    />
  );
}

export function PrimaryButton({
  loading,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`w-full mt-6 py-[13px] rounded-[11px] border-none font-sans text-[14.5px] font-[550] text-on-dark transition-colors ${
        loading
          ? "bg-text-soft cursor-not-allowed"
          : "bg-foreground cursor-pointer"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`bg-transparent border-none font-sans cursor-pointer p-0 ${className}`}
    >
      {children}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[var(--pl-radius-btn)] px-[13px] py-[10px] text-[13px] text-[#991B1B] mb-[18px]">
      {message}
    </div>
  );
}

export function Divider({ label = "or continue with" }: { label?: string }) {
  return (
    <div className="flex items-center gap-[14px] my-6">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11.5px] text-text-eyebrow">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function OAuthRow({
  onGoogle,
  onApple,
}: {
  onGoogle: () => void;
  onApple: () => void;
}) {
  const btnCls =
    "flex-1 flex items-center justify-center gap-[9px] py-[11px] rounded-[var(--pl-radius-input)] border border-border-input bg-surface font-sans text-[13.5px] font-medium text-foreground cursor-pointer";
  return (
    <div className="flex gap-[11px]">
      <button onClick={onGoogle} className={btnCls}>
        <span className="w-[18px] h-[18px] rounded-full bg-sidebar text-text-soft inline-flex items-center justify-center text-[11px] font-bold font-serif">
          G
        </span>
        Google
      </button>
      <button onClick={onApple} className={btnCls}>
        <span className="w-[18px] h-[18px] rounded-full bg-foreground text-on-dark inline-flex items-center justify-center text-[11px]">
          ⌘
        </span>
        Apple
      </button>
    </div>
  );
}
