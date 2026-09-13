"use client";

interface PillSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function PillSwitch({ checked, onChange, label, disabled, size = "sm" }: PillSwitchProps) {
  const trackW = size === "sm" ? 30 : 36;
  const trackH = size === "sm" ? 16 : 20;
  const thumb = trackH - 4;

  return (
    <div className="flex items-center gap-2 select-none" style={{ opacity: disabled ? 0.4 : 1 }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative rounded-full transition-colors flex-shrink-0"
        style={{
          width: trackW,
          height: trackH,
          backgroundColor: checked ? "var(--color-paper-rust)" : "rgba(26,26,26,0.18)",
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform"
          style={{
            width: thumb,
            height: thumb,
            transform: checked ? `translateX(${trackW - thumb - 4}px)` : "translateX(0)",
          }}
        />
      </button>
      <span className="text-xs text-paper-ink" style={{ fontFamily: "var(--font-body)" }}>{label}</span>
    </div>
  );
}
