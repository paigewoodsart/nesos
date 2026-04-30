"use client";

import { useRef, useEffect } from "react";
import type { ParsedTaskAction } from "@/types";

export interface BotMessage {
  role: "user" | "bot";
  text: string;
}

interface BloomBotPanelProps {
  messages: BotMessage[];
  loading: boolean;
  pending: ParsedTaskAction | null;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onConfirm: () => void;
  onReject: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function BloomBotPanel({
  messages, loading, pending, input, onInputChange, onSend, onConfirm, onReject, inputRef,
}: BloomBotPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px] max-h-[50vh]">
        {messages.length === 0 && (
          <p className="text-sm text-paper-ink-light italic" style={{ fontFamily: "var(--font-serif)" }}>
            Tell me what to add — tasks, goals, events. Try:<br />
            <span className="not-italic text-paper-ink-light text-xs">"recurring meeting monday 9-10am"</span><br />
            <span className="not-italic text-paper-ink-light text-xs">"long-term goal: learn ceramics"</span>
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-sm text-sm ${
                m.role === "user"
                  ? "bg-paper-rust/10 text-paper-ink border border-paper-rust/20"
                  : "bg-paper-warm text-paper-ink border border-paper-line"
              }`}
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex gap-2 justify-start">
            <button
              onClick={onConfirm}
              className="px-3 py-1 text-xs bg-paper-sage/20 text-paper-sage border border-paper-sage/30 rounded-sm hover:bg-paper-sage/30 transition-colors"
            >
              ✓ Yes
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1 text-xs bg-paper-rust/10 text-paper-rust border border-paper-rust/20 rounded-sm hover:bg-paper-rust/20 transition-colors"
            >
              ✗ No
            </button>
          </div>
        )}
        {loading && (
          <div className="text-paper-ink-light text-xs italic animate-pulse-soft" style={{ fontFamily: "var(--font-serif)" }}>
            thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t border-paper-line pt-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="what should I add?"
          className="flex-1 text-sm bg-transparent border-b border-paper-ink-light/40 outline-none placeholder:text-paper-ink-light text-paper-ink pb-1"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        />
        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className="text-paper-ink-light hover:text-paper-rust transition-colors text-sm disabled:opacity-30"
        >
          send →
        </button>
      </div>
    </div>
  );
}
