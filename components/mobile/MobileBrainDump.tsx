"use client";

import { MobileScreenHeader } from "./MobileScreenHeader";

const RASPBERRY = "#D4909E";

interface MobileBrainDumpProps {
  brainDump: string;
  onBrainDumpChange: (text: string) => void;
  onBack: () => void;
  onOpenDrawer: () => void;
}

export function MobileBrainDump({ brainDump, onBrainDumpChange, onBack, onOpenDrawer }: MobileBrainDumpProps) {
  return (
    <div className="flex flex-col h-screen bg-paper-cream">
      <MobileScreenHeader title="Brain Dump" onBack={onBack} onOpenDrawer={onOpenDrawer} accent={RASPBERRY} />
      <div className="flex-1 px-5 pt-4 pb-8 flex flex-col">
        <textarea
          value={brainDump}
          onChange={(e) => onBrainDumpChange(e.target.value)}
          placeholder="dump everything here... thoughts, worries, ideas, anything..."
          className="flex-1 w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-paper-ink placeholder:text-paper-ink-light italic"
          style={{ fontFamily: "var(--font-serif)" }}
        />
      </div>
    </div>
  );
}
