"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Client, ClientTask } from "@/types";
import { buildExportPdf, buildExportText, filterExportTasks, type ExportScope } from "@/lib/export";
import { THEME_SWATCH_COLOR, type Theme } from "@/lib/theme";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  tasksByClient: Record<string, ClientTask[]>;
  lockedClientId?: string;
  userName?: string | null;
  theme?: Theme;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExportModal({ open, onClose, clients, tasksByClient, lockedClientId, userName, theme = "original" }: ExportModalProps) {
  const selectableClients = useMemo(() => clients.filter((c) => !c.archived), [clients]);
  const lockedClient = lockedClientId ? clients.find((c) => c.id === lockedClientId) : null;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scope, setScope] = useState<ExportScope>("all");
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(lockedClientId ? [lockedClientId] : []);
    setScope("all");
    setDateFrom(todayISO());
    setDateTo(todayISO());
    setIncludeCompleted(false);
    setCopied(false);
  }, [open, lockedClientId]);

  if (!open) return null;

  const clientIds = lockedClientId ? [lockedClientId] : selectedIds;
  const canExport = clientIds.length > 0 && (scope !== "dated" || (dateFrom && dateTo));

  const toggleClient = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(selectableClients.map((c) => c.id));
  const clearAll = () => setSelectedIds([]);

  const getFiltered = () =>
    filterExportTasks(
      tasksByClient,
      clientIds,
      scope,
      scope === "dated" ? { from: dateFrom, to: dateTo } : null,
      includeCompleted
    );

  const handleDownloadPdf = async () => {
    if (!canExport) return;
    const filtered = getFiltered();
    const doc = await buildExportPdf(clients, filtered, userName);
    doc.save("nesos-export.pdf");
  };

  const handleCopyText = async () => {
    if (!canExport) return;
    const filtered = getFiltered();
    const text = buildExportText(clients, filtered);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Tasks"
      cardStyle={{
        backgroundColor: "rgba(249, 248, 246, 0.7)",
        border: `1.5px solid ${THEME_SWATCH_COLOR[theme]}`,
        backdropFilter: "blur(14px)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-paper-ink-light hover:text-paper-ink transition-colors text-lg z-20"
      >
        ×
      </button>
      <div className="flex flex-col gap-4" style={{ fontFamily: "var(--font-body)" }}>
        {lockedClient ? (
          <p className="text-sm text-paper-ink">
            Exporting: <span className="font-semibold">{lockedClient.name}</span>
          </p>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs uppercase tracking-[0.15em] text-paper-ink-light">Projects</span>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={selectAll} className="text-paper-ink-light hover:text-paper-ink underline">
                  Select all
                </button>
                <button type="button" onClick={clearAll} className="text-paper-ink-light hover:text-paper-ink underline">
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1 border border-paper-line rounded-sm p-2">
              {selectableClients.map((c) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleClient(c.id)}
                    className="flex items-center gap-2 text-sm text-paper-ink cursor-pointer py-0.5"
                  >
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-sm border-2 transition-all flex items-center justify-center"
                      style={{
                        borderColor: checked ? c.color : "rgba(26,26,26,0.25)",
                        backgroundColor: checked ? c.color : "transparent",
                      }}
                    >
                      {checked && (
                        <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </div>
                );
              })}
              {selectableClients.length === 0 && (
                <p className="text-xs text-paper-ink-light">No projects available.</p>
              )}
            </div>
          </div>
        )}

        <div>
          <span className="text-xs uppercase tracking-[0.15em] text-paper-ink-light block mb-1.5">Scope</span>
          <div className="flex flex-col gap-1.5 text-sm text-paper-ink">
            {([
              ["dated", "Tasks with a due date"],
              ["all", "All tasks"],
              ["archive", "Entire archive"],
            ] as [ExportScope, string][]).map(([value, label]) => (
              <div
                key={value}
                onClick={() => setScope(value)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span
                  className="flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{ borderColor: scope === value ? "#1A1A1A" : "rgba(26,26,26,0.25)" }}
                >
                  {scope === value && <span className="w-2 h-2 rounded-full bg-paper-ink" />}
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {scope === "dated" && (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-paper-line rounded-sm px-2 py-1 bg-transparent text-paper-ink"
            />
            <span className="text-paper-ink-light">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-paper-line rounded-sm px-2 py-1 bg-transparent text-paper-ink"
            />
          </div>
        )}

        <div
          onClick={() => setIncludeCompleted((v) => !v)}
          className="flex items-center gap-2 text-sm text-paper-ink cursor-pointer"
        >
          <span
            className="flex-shrink-0 w-4 h-4 rounded-sm border-2 transition-all flex items-center justify-center"
            style={{
              borderColor: includeCompleted ? "#1A1A1A" : "rgba(26,26,26,0.25)",
              backgroundColor: includeCompleted ? "#1A1A1A" : "transparent",
            }}
          >
            {includeCompleted && (
              <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          Include completed tasks
        </div>

        <div className="flex gap-2 pt-2 border-t border-paper-line">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!canExport}
            className="flex-1 text-sm px-3 py-2 rounded-sm bg-paper-ink text-paper-cream disabled:opacity-40"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            disabled={!canExport}
            className="flex-1 text-sm px-3 py-2 rounded-sm border border-paper-ink text-paper-ink disabled:opacity-40"
          >
            {copied ? "Copied!" : "Copy as Text"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
