import { useState } from 'react';
import type { Role, Staff } from '@/types';
import { Button, Input, Select } from '@/components/ui';
import { ROLE_CONFIG } from '@/lib/roles';

export interface StaffFormValues {
  name: string;
  email: string;
  role: Role;
}

const ROLES = Object.keys(ROLE_CONFIG) as Role[];

export function StaffForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Staff;
  onSubmit: (v: StaffFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role, setRole] = useState<Role>(initial?.role ?? 'waiter');

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && email.trim()) onSubmit({ name: name.trim(), email: email.trim(), role });
      }}
    >
      <Input label="Full name" placeholder="e.g. Ravi Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Email" type="email" placeholder="staff@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
        {ROLES.map((r) => (
          <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
        ))}
      </Select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add staff'}</Button>
      </div>
    </form>
  );
}
