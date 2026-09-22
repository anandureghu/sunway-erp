/** Opens invoice HTML in a new window and prints — same approach as employment contracts. */
export function printInvoiceElement(elementId: string, title = "Invoice"): void {
  const el = document.getElementById(elementId);
  if (!el) {
    throw new Error("Invoice document is not ready to print.");
  }

  const win = window.open("", "_blank");
  if (!win) {
    throw new Error(
      "Popup blocked — please allow popups for this site and try again.",
    );
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { padding: 12mm 10mm; }
    .no-print { display: none !important; }
    @media print {
      html, body { margin: 0; padding: 0; }
      @page { size: A4 portrait; margin: 10mm; }
    }
  </style>
</head>
<body>
  ${el.outerHTML}
  <script>
    window.addEventListener("load", function () { window.print(); });
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
