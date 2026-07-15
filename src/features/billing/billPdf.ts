import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bill, OrderItem } from '@/types';
import { formatMoney, formatDateTime } from '@/lib/format';
import { restaurantService, orderService } from '@/data/services';

// ─────────────────────────────────────────────────────────────────────────────
// Final customer invoice — A4, print-ready. This is the ONLY place the invoice
// PDF is built; nothing outside this file changes. Restaurant identity (address,
// phone, logo, brand colour) and the line items are read here via the existing
// services so no caller signature, component, schema or business rule is touched.
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_FALLBACK = '#c0451c'; // ember-500

function hexToRgb(hex?: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? '').trim());
  if (!m) return hexToRgb(BRAND_FALLBACK);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * jsPDF's built-in Helvetica only covers Latin-1, so glyphs outside it — notably
 * the Indian Rupee ₹ (U+20B9) — render as garbage and throw off amount spacing
 * (₹280 came out as "¹ 8 0"). Swap such symbols for an ASCII-safe prefix for the
 * PDF only; the on-screen invoice keeps the real symbol. Latin-1 symbols like
 * $ and £ pass through unchanged.
 */
function pdfSafeSymbol(symbol: string): string {
  const map: Record<string, string> = { '₹': 'Rs. ', '₩': 'KRW ', '₫': 'VND ', '₽': 'RUB ', '฿': 'THB ', '€': 'EUR ' };
  return map[symbol] ?? symbol;
}

/**
 * Resolve the invoice's line items. A bill's `items` are populated the moment it
 * is generated, but bills hydrated from Supabase come back with `items: []`
 * (they are not persisted as their own table). In that case we rebuild the exact
 * lines from the dining session's orders — whose items ARE hydrated — so the PDF
 * always shows everything that was ordered, on any device and after any reload.
 */
function resolveItems(bill: Bill): OrderItem[] {
  if (bill.items?.length) return bill.items;
  if (bill.sessionId) {
    const fromSession = orderService.bySession(bill.restaurantId, bill.sessionId).flatMap((o) => o.items);
    if (fromSession.length) return fromSession;
  }
  return orderService.get(bill.orderId)?.items ?? [];
}

/** Load a logo URL (remote or data URI) into a PNG data URL. Null on any failure. */
function loadLogo(url?: string): Promise<{ data: string; ratio: number } | null> {
  if (!url || typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve({ data: canvas.toDataURL('image/png'), ratio: img.naturalWidth / (img.naturalHeight || 1) });
      } catch {
        resolve(null); // tainted canvas (CORS) → fall back to the brand badge
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function buildDoc(bill: Bill, restaurantName: string, symbol: string): Promise<jsPDF> {
  const restaurant = restaurantService.getById(bill.restaurantId);
  const name = restaurantName || restaurant?.name || 'Invoice';
  const address = restaurant?.address?.trim();
  const phone = restaurant?.phone?.trim();
  const brand = hexToRgb(restaurant?.logoColor);
  const logo = await loadLogo(restaurant?.logoUrl);
  const items = resolveItems(bill);
  // Always the stored, immutable invoice number — never recomputed here.
  const invoiceNo = bill.invoiceNumber ?? '—';
  const money = (n: number) => formatMoney(n, pdfSafeSymbol(symbol));

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const Hp = doc.internal.pageSize.getHeight();
  const M = 40;
  const right = W - M;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...brand);
  doc.rect(0, 0, W, 6, 'F'); // top accent band

  const box = 54;
  const boxY = 34;
  if (logo) {
    let lw = box;
    let lh = box;
    if (logo.ratio >= 1) lh = box / logo.ratio;
    else lw = box * logo.ratio;
    doc.addImage(logo.data, 'PNG', M + (box - lw) / 2, boxY + (box - lh) / 2, lw, lh);
  } else {
    doc.setFillColor(...brand);
    doc.roundedRect(M, boxY, box, box, 10, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255);
    doc.text((name.charAt(0) || '?').toUpperCase(), M + box / 2, boxY + box / 2 + 9, { align: 'center' });
  }

  const tx = M + box + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(25);
  doc.text(name, tx, boxY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(120);
  let iy = boxY + 34;
  if (address) { doc.text(address, tx, iy); iy += 13; }
  if (phone) { doc.text(`Tel: ${phone}`, tx, iy); iy += 13; }

  // Invoice title + number (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...brand);
  doc.text('INVOICE', right, boxY + 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`No. ${invoiceNo}`, right, boxY + 34, { align: 'right' });

  // Payment status badge (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const status = 'PAID';
  const bw = doc.getTextWidth(status) + 16;
  const bh = 18;
  const bx = right - bw;
  const by = boxY + 44;
  doc.setFillColor(34, 150, 74);
  doc.roundedRect(bx, by, bw, bh, 4, 4, 'F');
  doc.setTextColor(255);
  doc.text(status, bx + bw / 2, by + 12.5, { align: 'center' });

  // ── Meta panel ──────────────────────────────────────────────────────────────
  const panelY = 108;
  const panelH = 48;
  doc.setFillColor(246, 243, 238);
  doc.roundedRect(M, panelY, right - M, panelH, 6, 6, 'F');
  const meta: [string, string][] = [
    ['INVOICE NO', invoiceNo],
    ['ORDER ID', bill.orderId.slice(-6).toUpperCase()],
    ['TABLE', String(bill.tableNumber)],
    ['DATE & TIME', formatDateTime(bill.createdAt)],
  ];
  const colW = (right - M) / meta.length;
  meta.forEach(([label, value], i) => {
    const cx = M + 16 + i * colW;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text(label, cx, panelY + 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30);
    doc.text(value, cx, panelY + 34);
  });

  // ── Items table ─────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: panelY + panelH + 22,
    head: [['Item', 'Qty', 'Unit Price', 'Amount']],
    body: items.map((it) => [
      it.name,
      String(it.qty),
      money(it.unitPrice),
      money(it.unitPrice * it.qty),
    ]),
    theme: 'striped',
    headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold', halign: 'left', cellPadding: 7 },
    bodyStyles: { textColor: 45, cellPadding: 7, fontSize: 10 },
    alternateRowStyles: { fillColor: [250, 248, 245] },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', cellWidth: 55 },
      2: { halign: 'right', cellWidth: 95 },
      3: { halign: 'right', cellWidth: 100 },
    },
    margin: { left: M, right: M },
  });

  // ── Totals ──────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ty = (doc as any).lastAutoTable.finalY + 26;
  const labelX = right - 210;
  const totalRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(90);
    doc.text(label, labelX, ty);
    doc.setTextColor(30);
    doc.text(value, right, ty, { align: 'right' });
    ty += 19;
  };
  totalRow('Subtotal', money(bill.subtotal));
  totalRow('Tax', money(bill.tax));
  totalRow('Service Charge', money(bill.serviceCharge));

  // Grand total — highlighted band
  ty += 4;
  const gx = labelX - 16;
  doc.setFillColor(...brand);
  doc.roundedRect(gx, ty - 14, right - gx, 30, 5, 5, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('GRAND TOTAL', labelX, ty + 5);
  doc.text(money(bill.grandTotal), right - 10, ty + 5, { align: 'right' });
  ty += 34;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(120);
  doc.text('Payment Status:', labelX, ty);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 150, 74);
  doc.text('PAID', right, ty, { align: 'right' });

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footY = Hp - 56;
  doc.setDrawColor(224);
  doc.setLineWidth(0.8);
  doc.line(M, footY - 18, right, footY - 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...brand);
  doc.text('Thank you for dining with us!', W / 2, footY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(155);
  doc.text('This is a computer-generated invoice and does not require a signature.', W / 2, footY + 15, { align: 'center' });

  return doc;
}

export async function downloadBillPdf(bill: Bill, restaurantName: string, symbol: string): Promise<void> {
  const doc = await buildDoc(bill, restaurantName, symbol);
  doc.save(`${bill.invoiceNumber ?? `invoice-${bill.id.slice(-6)}`}.pdf`);
}

export async function printBillPdf(bill: Bill, restaurantName: string, symbol: string): Promise<void> {
  const doc = await buildDoc(bill, restaurantName, symbol);
  doc.autoPrint();
  const url = doc.output('bloburl');
  window.open(url, '_blank');
}
