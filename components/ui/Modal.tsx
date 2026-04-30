"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ open, onClose, children, title }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="absolute inset-0 bg-paper-ink/20 backdrop-blur-[2px]" />
      <div
        className="animate-modal-in relative z-10 bg-paper-cream rounded-sm shadow-lg w-full max-w-md"
        style={{ boxShadow: "2px 3px 24px rgba(44, 36, 22, 0.14)" }}
      >
        {title && (
          <div className="px-5 pt-5 pb-3 border-b border-paper-line">
            <h3
              className="text-lg font-medium text-paper-ink"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {title}
            </h3>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
