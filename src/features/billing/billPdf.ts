import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bill } from '@/types';
import { formatMoney, formatDateTime } from '@/lib/format';

/** Build a receipt-style PDF for a bill. */
function buildDoc(bill: Bill, restaurantName: string, symbol: string): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a5' });
  const w = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(restaurantName, w / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Tax Invoice  #${bill.id.slice(-6).toUpperCase()}`, w / 2, 66, { align: 'center' });
  doc.text(`Table ${bill.tableNumber}  ·  ${formatDateTime(bill.createdAt)}`, w / 2, 80, { align: 'center' });
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 100,
    head: [['Item', 'Qty', 'Amount']],
    body: bill.items.map((it) => [it.name, String(it.qty), formatMoney(it.unitPrice * it.qty, symbol)]),
    theme: 'plain',
    headStyles: { fillColor: [244, 236, 225], textColor: 40, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
    margin: { left: 32, right: 32 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let y = (doc as any).lastAutoTable.finalY + 18;
  const right = w - 32;
  const line = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 13 : 11);
    doc.text(label, 32, y);
    doc.text(value, right, y, { align: 'right' });
    y += bold ? 22 : 16;
  };
  line('Subtotal', formatMoney(bill.subtotal, symbol));
  line('Tax', formatMoney(bill.tax, symbol));
  line('Service charge', formatMoney(bill.serviceCharge, symbol));
  doc.setDrawColor(200);
  doc.line(32, y - 6, right, y - 6);
  line('Grand Total', formatMoney(bill.grandTotal, symbol), true);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Thank you for dining with us!', w / 2, y + 12, { align: 'center' });

  return doc;
}

export function downloadBillPdf(bill: Bill, restaurantName: string, symbol: string): void {
  buildDoc(bill, restaurantName, symbol).save(`bill-${bill.id.slice(-6)}.pdf`);
}

export function printBillPdf(bill: Bill, restaurantName: string, symbol: string): void {
  const doc = buildDoc(bill, restaurantName, symbol);
  doc.autoPrint();
  const url = doc.output('bloburl');
  window.open(url, '_blank');
}
