import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { RefObject } from "react";
import type { PayslipData } from "@/types/hr";
import { formatPayPeriod } from "./payslip.utils";

export interface PayslipPDFOptions {
  filename?: string;
  scale?: number;
  preview?: boolean;
}

export async function downloadPayslipPDF(
  ref: RefObject<HTMLDivElement>,
  data: PayslipData,
  options: PayslipPDFOptions = {}
): Promise<void> {
  const node = ref.current;
  if (!node) throw new Error("payslipPDF: ref.current is null");

  const { scale = 2, preview = false } = options;

  const name = options.filename ?? buildFilename(data);

  const canvas = await html2canvas(node, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: "#FFFFFF",
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");

  const canvasWidthPx  = canvas.width  / scale;
  const canvasHeightPx = canvas.height / scale;

  const pxToMm = (px: number) => (px * 25.4) / 96;

  const widthMm  = pxToMm(canvasWidthPx);
  const heightMm = pxToMm(canvasHeightPx);

  const orientation = widthMm > 200 ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: orientation === "landscape" ? [heightMm, widthMm] : [widthMm, heightMm],
  });

  pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);

  if (preview) {
    const blob = pdf.output("blob");
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } else {
    pdf.save(`${name}.pdf`);
  }
}

function buildFilename(data: PayslipData): string {
  const emp = data.employee;
  const name = `${emp.firstName ?? ""}-${emp.lastName ?? ""}`.replace(/\s+/g, "-");
  const period = formatPayPeriod(data.payroll?.payPeriodStart ?? "").replace(/\s+/g, "-");
  const code = data.payroll?.payrollCode ?? "payslip";
  return `${name}_${period}_${code}`.replace(/[^a-zA-Z0-9_\-]/g, "");
}

