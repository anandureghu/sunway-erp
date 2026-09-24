/** Opens invoice HTML in a new window and prints — same markup + styles as on-screen preview. */
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

  // Clone the live Tailwind/app stylesheets so print matches the on-screen preview.
  const styleTags: string[] = [];
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    if (node instanceof HTMLLinkElement && node.href) {
      styleTags.push(
        `<link rel="stylesheet" href="${escapeHtml(node.href)}" />`,
      );
    } else if (node instanceof HTMLStyleElement) {
      styleTags.push(`<style>${node.textContent ?? ""}</style>`);
    }
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  ${styleTags.join("\n  ")}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { padding: 8mm 6mm; }
    .no-print { display: none !important; }
    /* Tighten preview chrome that is fine on screen but wasteful on paper */
    #${CSS.escape(elementId)} {
      max-width: none !important;
      width: 100% !important;
      margin: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }
    @media print {
      html, body { margin: 0; padding: 0; background: #fff !important; }
      @page { size: A4 portrait; margin: 10mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${el.outerHTML}
  <script>
    (function () {
      function whenReady(cb) {
        var imgs = Array.prototype.slice.call(document.images || []);
        if (!imgs.length) { cb(); return; }
        var left = imgs.length;
        var done = function () { left -= 1; if (left <= 0) cb(); };
        imgs.forEach(function (img) {
          if (img.complete) done();
          else {
            img.addEventListener("load", done);
            img.addEventListener("error", done);
          }
        });
        setTimeout(cb, 2500);
      }
      whenReady(function () {
        setTimeout(function () { window.focus(); window.print(); }, 50);
      });
    })();
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
