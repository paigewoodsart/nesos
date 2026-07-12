import { jsPDF } from "jspdf";
import type { Client, ClientTask } from "@/types";

export type ExportScope = "dated" | "all" | "archive";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

function parseDueDate(dueDate: string | null): Date | null {
  if (!dueDate) return null;
  const d = new Date(dueDate.length <= 5 ? `${new Date().getFullYear()}/${dueDate}` : dueDate);
  return isNaN(d.getTime()) ? null : d;
}

function inRange(dueDate: string | null, range: DateRange): boolean {
  const d = parseDueDate(dueDate);
  if (!d) return false;
  const from = new Date(range.from);
  const to = new Date(range.to);
  return d >= from && d <= to;
}

export function filterExportTasks(
  tasksByClient: Record<string, ClientTask[]>,
  clientIds: string[],
  scope: ExportScope,
  dateRange: DateRange | null,
  includeCompleted: boolean
): Record<string, ClientTask[]> {
  const result: Record<string, ClientTask[]> = {};

  for (const clientId of clientIds) {
    const tasks = tasksByClient[clientId] ?? [];
    let filtered = tasks.filter((t) => {
      if (scope === "archive") return t.archived;
      if (t.archived) return false;
      if (scope === "dated") {
        if (!dateRange) return false;
        return inRange(t.dueDate, dateRange);
      }
      return true; // scope === "all"
    });

    if (!includeCompleted) {
      filtered = filtered.filter((t) => !t.done);
    }

    filtered.sort((a, b) => {
      const da = parseDueDate(a.dueDate);
      const db = parseDueDate(b.dueDate);
      if (da && db) return da.getTime() - db.getTime();
      if (da) return -1;
      if (db) return 1;
      return 0;
    });

    result[clientId] = filtered;
  }

  return result;
}

function formatDueDate(dueDate: string | null): string {
  const d = parseDueDate(dueDate);
  if (!d) return "";
  return ` - due ${d.getMonth() + 1}/${d.getDate()}`;
}

export function buildExportText(
  clients: Client[],
  filteredTasksByClient: Record<string, ClientTask[]>
): string {
  const clientIds = Object.keys(filteredTasksByClient);
  const multiProject = clientIds.length > 1;
  const sections: string[] = [];

  for (const client of clients) {
    const tasks = filteredTasksByClient[client.id];
    if (!tasks) continue;

    const lines: string[] = [];
    if (multiProject) {
      lines.push(client.name);
    } else {
      lines.push(client.name);
    }
    for (const t of tasks) {
      lines.push(`[ ] ${t.text}${formatDueDate(t.dueDate)}`);
    }
    if (tasks.length === 0) {
      lines.push("(no tasks)");
    }
    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

let logoDataUrl: string | null | undefined;

async function loadLogoDataUrl(): Promise<string | null> {
  if (logoDataUrl !== undefined) return logoDataUrl;
  try {
    const res = await fetch("/nesos-icon.webp");
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas context");
    ctx.drawImage(bitmap, 0, 0);
    logoDataUrl = canvas.toDataURL("image/png");
  } catch {
    logoDataUrl = null;
  }
  return logoDataUrl;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

let interFontsLoaded: Promise<boolean> | undefined;

async function loadInterFonts(doc: jsPDF): Promise<boolean> {
  if (!interFontsLoaded) {
    interFontsLoaded = (async () => {
      try {
        const [regularBuf, boldBuf] = await Promise.all([
          fetch("/fonts/Inter-Regular.ttf").then((r) => r.arrayBuffer()),
          fetch("/fonts/Inter-Bold.ttf").then((r) => r.arrayBuffer()),
        ]);
        cachedInterRegular = arrayBufferToBase64(regularBuf);
        cachedInterBold = arrayBufferToBase64(boldBuf);
        return true;
      } catch {
        return false;
      }
    })();
  }
  const ok = await interFontsLoaded;
  if (ok && cachedInterRegular && cachedInterBold) {
    doc.addFileToVFS("Inter-Regular.ttf", cachedInterRegular);
    doc.addFont("Inter-Regular.ttf", "Inter", "normal");
    doc.addFileToVFS("Inter-Bold.ttf", cachedInterBold);
    doc.addFont("Inter-Bold.ttf", "Inter", "bold");
  }
  return ok;
}

let cachedInterRegular: string | undefined;
let cachedInterBold: string | undefined;

export async function buildExportPdf(
  clients: Client[],
  filteredTasksByClient: Record<string, ClientTask[]>,
  userName?: string | null
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - marginLeft - marginRight;

  const hasInter = await loadInterFonts(doc);
  const bodyFont = hasInter ? "Inter" : "helvetica";

  // Header: logo only, plus the user's name if we have one
  const logo = await loadLogoDataUrl();
  const logoSize = 10;
  const headerTop = 12;
  if (logo) {
    doc.addImage(logo, "PNG", marginLeft, headerTop, logoSize, logoSize);
  }
  if (userName) {
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(26, 26, 26);
    doc.text(userName, marginLeft + (logo ? logoSize + 4 : 0), headerTop + logoSize / 2 + 3);
  }

  let y = headerTop + logoSize + 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
  };

  for (const client of clients) {
    const tasks = filteredTasksByClient[client.id];
    if (!tasks) continue;

    ensureSpace(10);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    const [r, g, b] = hexToRgb(client.color);
    doc.setTextColor(r, g, b);
    doc.text(client.name.toUpperCase(), marginLeft, y);
    y += 8;

    doc.setFont(bodyFont, "normal");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);

    if (tasks.length === 0) {
      ensureSpace(6);
      doc.text("(no tasks)", marginLeft, y);
      y += 6;
    }

    for (const t of tasks) {
      const line = `•  ${t.text}${formatDueDate(t.dueDate)}`;
      const wrapped = doc.splitTextToSize(line, maxWidth);
      ensureSpace(wrapped.length * 6);
      doc.text(wrapped, marginLeft, y);
      y += wrapped.length * 6;
    }

    y += 6;
  }

  return doc;
}
