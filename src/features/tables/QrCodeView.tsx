import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { Button, Spinner } from '@/components/ui';

/**
 * Feature 1 — generates a scannable QR for a table's ordering deep-link.
 * The QR encodes the absolute URL so a real phone camera can open it.
 *
 * Presented as the printed table placard it becomes in the room: house name,
 * a hairline rule with a gold diamond, the code, then the table line.
 */
export function QrCodeView({ path, label }: { path: string; label: string }) {
  const { restaurant } = useTenant();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const absoluteUrl = `${window.location.origin}${path}`;

  useEffect(() => {
    QRCode.toDataURL(absoluteUrl, { width: 480, margin: 1, color: { dark: '#2a211b', light: '#faf6ef' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [absoluteUrl]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${label.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    a.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[15rem] rounded-2xl border border-ink/12 bg-white px-5 py-4 text-center shadow-soft">
        <p className="text-[0.52rem] font-bold uppercase tracking-[0.22em] text-ink-muted">Scan to order</p>
        <p className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
          {restaurant?.name ?? 'ToDining'}
        </p>

        {/* Hairline rule with a centred gold diamond — the house signature. */}
        <div className="my-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-ink/12" />
          <span className="h-1 w-1 rotate-45 bg-gold-400" />
          <span className="h-px flex-1 bg-ink/12" />
        </div>

        <div className="mx-auto grid h-36 w-36 place-items-center">
          {dataUrl ? <img src={dataUrl} alt={`QR for ${label}`} className="h-full w-full" /> : <Spinner />}
        </div>

        <p className="tnum mt-3 border-t border-ink/12 pt-2.5 font-display text-base font-semibold tracking-tight">
          {label}
        </p>
      </div>

      <p className="break-all text-center text-[0.68rem] text-ink-muted">{absoluteUrl}</p>
      <Button variant="outline" size="sm" onClick={download} disabled={!dataUrl}>
        <Download className="h-4 w-4" /> Download PNG
      </Button>
    </div>
  );
}
