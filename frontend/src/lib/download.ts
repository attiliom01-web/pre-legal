import { jsPDF } from "jspdf";

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(markdown: string, filename = "Mutual-NDA.md") {
  save(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), filename);
}

const plain = (s: string) =>
  s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\\\|/g, "|");

export function downloadPdf(markdown: string, filename = "Mutual-NDA.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;

  const write = (text: string, size: number, bold = false, indent = 0) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    for (const line of doc.splitTextToSize(text, width - indent) as string[]) {
      if (y + size > bottom) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin + indent, y);
      y += size * 1.35;
    }
    y += size * 0.4;
  };

  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (!line || /^\|[:\-\s|]+\|?$/.test(line)) continue;
    if (line === "---") {
      doc.addPage();
      y = margin;
    } else if (line.startsWith("# ")) write(plain(line.slice(2)), 18, true);
    else if (line.startsWith("## ")) write(plain(line.slice(3)), 14, true);
    else if (line.startsWith("### ")) write(plain(line.slice(4)), 12, true);
    else if (line.startsWith("|"))
      write(
        plain(line)
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim())
          .join("  |  "),
        10,
      );
    else if (line.startsWith("- "))
      write(plain(line).replace(/^- \[x\]/, "[x]").replace(/^- \[ \]/, "[ ]"), 10, false, 12);
    else write(plain(line), 10);
  }
  doc.save(filename);
}
