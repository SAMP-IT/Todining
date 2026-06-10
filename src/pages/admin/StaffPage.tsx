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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-base font-bold text-white" style={{ background: s.avatarColor ?? '#d9521f' }}>
                {s.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.name}{s.id === user?.id && <span className="ml-1 text-xs text-ink-muted">(you)</span>}</p>
                <p className="truncate text-xs text-ink-muted">{s.email}</p>
                <Badge tone={ROLE_TONE[s.role]} className="mt-1">{ROLE_CONFIG[s.role].label}</Badge>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-ink/5" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                {s.id !== user?.id && (
                  <button onClick={() => { staffService.remove(s.id); toast('Staff removed.'); }} className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-500" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
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
