"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { BloomBotPanel } from "@/components/shared/BloomBotPanel";
import type { BotMessage } from "@/components/shared/BloomBotPanel";
import type { ParsedTaskAction } from "@/types";

interface BloomBotProps {
  weekId: string;
  onAction: (action: ParsedTaskAction) => Promise<string>;
}

export function BloomBot({ weekId, onAction }: BloomBotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<ParsedTaskAction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const floatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, weekId }),
      });
      const action: ParsedTaskAction = await res.json();

      if (action.confidence < 0.7) {
        setPending(action);
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const day = action.dayIndex !== null ? days[action.dayIndex] : "this week";
        const preview = `"${action.text}"${action.dayIndex !== null ? ` on ${day}` : ""}`;
        setMessages((m) => [...m, { role: "bot", text: `Did you mean: ${preview}? (tap ✓ or ✗)` }]);
      } else {
        const confirmation = await onAction(action);
        setMessages((m) => [...m, { role: "bot", text: confirmation }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Hmm, something went sideways. Try again?" }]);
    }
    setLoading(false);
  }, [weekId, onAction, loading]);

  const handleSubmit = () => {
    send(input);
    setInput("");
  };

  const confirmPending = useCallback(async () => {
    if (!pending) return;
    const confirmation = await onAction(pending);
    setMessages((m) => [...m, { role: "bot", text: confirmation }]);
    setPending(null);
  }, [pending, onAction]);

  const rejectPending = useCallback(() => {
    setMessages((m) => [...m, { role: "bot", text: "Got it! Try rephrasing and I'll give it another go." }]);
    setPending(null);
  }, []);

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-paper-line bg-paper-cream/95 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="text-lg flex-shrink-0 hover:animate-bloom-wiggle transition-transform"
          title="Open Bloom Bot (⌘K)"
        >
          🌸
        </button>
        <input
          ref={floatInputRef}
          type="text"
          placeholder="tell bloom bot what to add... (⌘K for full chat)"
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-paper-ink-light text-paper-ink"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              send(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
      </div>

      {/* Full chat modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="🌸 Bloom Bot">
        <BloomBotPanel
          messages={messages}
          loading={loading}
          pending={pending}
          input={input}
          onInputChange={setInput}
          onSend={handleSubmit}
          onConfirm={confirmPending}
          onReject={rejectPending}
          inputRef={inputRef}
        />
      </Modal>
    </>
  );
}
