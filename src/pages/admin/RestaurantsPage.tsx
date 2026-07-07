import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeftRight, Building2, Check, Settings2, ShieldCheck } from 'lucide-react';
import type { Restaurant } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/context/AuthContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import {
  menuService, orderService, reservationService, restaurantService, staffService, tableService,
} from '@/data/services';
import { Badge, Button, Input, Modal, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

export function RestaurantsPage() {
  const { restaurant: active, restaurantId, allRestaurants, setRestaurantById } = useTenant();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoColor, setLogoColor] = useState('#d9521f');
  const [tax, setTax] = useState(0);
  const [service, setService] = useState(0);
  const [symbol, setSymbol] = useState('₹');

  // Restaurants owned by the signed-in user. An owner only ever manages their own
  // hotel(s) — never other tenants — so we resolve the hotel ids attached to every
  // staff record matching their login identifier, then include those hotels plus
  // any branches of them. Falls back to the active hotel if there is no signed-in
  // user or no match, so the page never renders blank.
  const ownedRestaurants = (() => {
    const ownedHotelIds = new Set(
      user ? staffService.findAllByIdentifier(user.email).map((s) => s.restaurantId) : [],
    );
    const mine = allRestaurants.filter(
      (r) => ownedHotelIds.has(r.id) || (r.parentId != null && ownedHotelIds.has(r.parentId)),
    );
    if (mine.length > 0) return mine;
    return active ? [active] : [];
  })();

  // Re-read counts whenever data changes anywhere (proves per-tenant isolation).
  const restaurants = useLiveQuery(
    () =>
      ownedRestaurants.map((r) => ({
        restaurant: r,
        stats: {
          menu: menuService.items(r.id).length,
          tables: tableService.list(r.id).length,
          orders: orderService.list(r.id).length,
          reservations: reservationService.list(r.id).length,
          staff: staffService.list(r.id).length,
        },
      })),
    { types: ['data:changed', 'order:created', 'reservation:created'] },
  );

  function openSettings(r: Restaurant) {
    setEditing(r);
    setName(r.name);
    setTagline(r.tagline ?? '');
    setLogoColor(r.logoColor);
    setTax(Math.round(r.settings.taxRate * 100));
    setService(Math.round(r.settings.serviceChargeRate * 100));
    setSymbol(r.settings.currencySymbol);
  }
  function saveSettings() {
    if (!editing || !name.trim()) return;
    restaurantService.update(editing.id, {
      name: name.trim(),
      tagline: tagline.trim(),
      logoColor,
      settings: { ...editing.settings, taxRate: tax / 100, serviceChargeRate: service / 100, currencySymbol: symbol },
    });
    toast.success('Restaurant settings updated.');
    setEditing(null);
  }

  return (
    <div>
      <PageHeader title="Restaurants" subtitle="Your restaurant workspace — menu, orders, staff and data, all in one place." />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-sage-500/30 bg-sage-50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" />
        <div>
          <p className="font-semibold text-sage-700">This workspace is yours alone</p>
          <p className="text-sm text-sage-600">Your menu, orders, bookings and staff are fully isolated to this restaurant. The counts below are scoped to it.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {restaurants.map(({ restaurant: r, stats }) => {
          const isActive = r.id === restaurantId;
          return (
            <div key={r.id} className={cn('rounded-2xl border-2 bg-white p-5 shadow-soft transition-colors', isActive ? 'border-ember-300' : 'border-ink/5')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-base font-bold text-white" style={{ background: r.logoColor }}>
                    {r.name.charAt(0)}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold leading-tight">{r.name}</h3>
                    <p className="text-xs text-ink-muted">{r.tagline}</p>
                  </div>
                </div>
                {isActive ? <Badge tone="ember" dot>Active</Badge> : null}
              </div>

              <div className="mt-4 grid grid-cols-5 gap-2 text-center">
                {[
                  ['Menu', stats.menu], ['Tables', stats.tables], ['Orders', stats.orders], ['Bookings', stats.reservations], ['Staff', stats.staff],
                ].map(([label, val]) => (
                  <div key={label as string} className="rounded-xl bg-cream-deep/50 py-2">
                    <div className="font-display text-lg font-semibold">{val as number}</div>
                    <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant={isActive ? 'outline' : 'primary'}
                  disabled={isActive}
                  onClick={() => { setRestaurantById(r.id); toast.success(`Switched to ${r.name}.`); }}
                >
                  {isActive ? <><Check className="h-4 w-4" /> Current</> : <><ArrowLeftRight className="h-4 w-4" /> Switch to</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openSettings(r)}>
                  <Settings2 className="h-4 w-4" /> Settings
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {active && (
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            <Building2 className="h-4 w-4" /> Currently managing <strong className="text-ink">{active.name}</strong>.
          </p>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Restaurant settings"
        description={editing?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveSettings}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Restaurant name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Authentic Indian kitchen" />
          <div className="flex items-end gap-3">
            <Input label="Brand colour" type="color" value={logoColor} onChange={(e) => setLogoColor(e.target.value)} className="h-11 w-20 p-1" />
            <span className="grid h-11 w-11 place-items-center rounded-xl text-base font-bold text-white" style={{ background: logoColor }}>
              {(name || editing?.name || '?').charAt(0)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Tax %" type="number" min={0} max={100} value={tax} onChange={(e) => setTax(e.target.valueAsNumber || 0)} />
            <Input label="Service %" type="number" min={0} max={100} value={service} onChange={(e) => setService(e.target.valueAsNumber || 0)} />
            <Input label="Currency" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
