import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { Staff } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/context/AuthContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { staffService } from '@/data/services';
import { Badge, Button, EmptyState, Modal, PageHeader } from '@/components/ui';
import { StaffForm } from '@/features/staff/StaffForm';
import { ROLE_CONFIG } from '@/lib/roles';
import { cn } from '@/lib/cn';

const ROLE_TONE = { owner: 'ember', manager: 'gold', waiter: 'sage', kitchen: 'blue' } as const;

export function StaffPage() {
  const { restaurantId } = useTenant();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Staff | null>(null);
  const [adding, setAdding] = useState(false);

  const staff = useLiveQuery<Staff[]>(() => (restaurantId ? staffService.list(restaurantId) : []), {
    restaurantId: restaurantId ?? undefined,
    types: ['data:changed'],
  });

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Manage your team and their access levels."
        actions={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add staff</Button>}
      />

      {staff.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No staff yet" description="Add team members and assign their roles." />
      ) : (
        <>
          {/* A hairline masthead, not a chip: the team is a single set list. */}
          <div className="mb-2.5 flex items-center justify-between gap-3 border-y border-ink/10 py-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink-soft">The team</span>
            <span className="tnum text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
              {staff.length} member{staff.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* One ruled sheet, one member per line — the roster reads top to
              bottom like a printed staff list rather than a grid of cards. */}
          <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
            {staff.map((s, i) => (
              <div
                key={s.id}
                className={cn('flex items-center gap-3 px-3 py-3 sm:px-4', i > 0 && 'border-t border-ink/10')}
              >
                {/* Initial well — keeps each member's seeded avatarColor. */}
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg font-display text-lg font-semibold leading-none text-cream"
                  style={{ background: s.avatarColor ?? '#c0451c' }}
                >
                  {s.name.charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate font-display text-lg font-semibold leading-tight">{s.name}</span>
                    {s.id === user?.id && (
                      <span className="shrink-0 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-ink-muted">
                        You
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[0.72rem] text-ink-muted">{s.email}</div>
                  {/* Role sits under the name on a phone, inline from sm up. */}
                  <Badge tone={ROLE_TONE[s.role]} className="mt-1 px-2 py-0 text-[0.6rem] sm:hidden">
                    {ROLE_CONFIG[s.role].label}
                  </Badge>
                </div>

                <Badge tone={ROLE_TONE[s.role]} className="hidden shrink-0 sm:inline-flex">
                  {ROLE_CONFIG[s.role].label}
                </Badge>

                <div className="flex shrink-0 gap-0.5">
                  <button onClick={() => setEditing(s)} className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  {/* You can't remove yourself. Hold the column so every row's
                      actions still line up on the same two rails. */}
                  {s.id !== user?.id ? (
                    <button onClick={() => { staffService.remove(s.id); toast('Staff removed.'); }} className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                  ) : (
                    <span className="w-8" aria-hidden />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add staff member">
        <StaffForm
          onCancel={() => setAdding(false)}
          onSubmit={(v) => {
            if (restaurantId) staffService.create(restaurantId, { ...v, active: true });
            setAdding(false);
            toast.success('Staff member added.');
          }}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit staff member">
        {editing && (
          <StaffForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => {
              staffService.update(editing.id, v);
              setEditing(null);
              toast.success('Staff updated.');
            }}
          />
        )}
      </Modal>
    </div>
  );
}
