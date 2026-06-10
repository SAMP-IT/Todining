import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';

/**
 * Feature 1 — generates a scannable QR for a table's ordering deep-link.
 * The QR encodes the absolute URL so a real phone camera can open it.
 */
export function QrCodeView({ path, label }: { path: string; label: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const absoluteUrl = `${window.location.origin}${path}`;

  useEffect(() => {
    QRCode.toDataURL(absoluteUrl, { width: 480, margin: 1, color: { dark: '#1c1714', light: '#ffffff' } })
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
      <div className="grid h-48 w-48 place-items-center rounded-2xl border border-ink/10 bg-white p-3">
        {dataUrl ? <img src={dataUrl} alt={`QR for ${label}`} className="h-full w-full" /> : <Spinner />}
      </div>
      <p className="break-all text-center text-xs text-ink-muted">{absoluteUrl}</p>
      <Button variant="outline" size="sm" onClick={download} disabled={!dataUrl}>
        <Download className="h-4 w-4" /> Download PNG
      </Button>
    </div>
  );
}
