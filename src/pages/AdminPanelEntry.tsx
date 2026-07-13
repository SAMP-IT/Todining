import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight, Building2, ChevronDown, Home, LogOut, Plus, ShieldCheck,
} from 'lucide-react';
import type { Restaurant } from '@/types';
import { Wordmark } from '@/components/layout/Brand';
import { Badge, Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { useTenant } from '@/context/TenantContext';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import {
  menuService, orderService, restaurantService, staffService, tableService,
} from '@/data/services';
import { cn } from '@/lib/cn';

interface CreateForm {
  name: string;
  ownerEmail: string;
  ownerUsername: string;
  password: string;
  logoColor: string;
  description: string;
}

const EMPTY_FORM: CreateForm = {
  name: '', ownerEmail: '', ownerUsername: '', password: '', logoColor: '#d9521f', description: '',
};

interface BranchForm {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  description: string;
  status: 'active' | 'inactive';
}

const EMPTY_BRANCH: BranchForm = {
  name: '', code: '', address: '', phone: '', email: '', manager: '', description: '', status: 'active',
};

/**
 * Hotel Workspace Dashboard — the central workspace manager at `/admin-panel`.
 * Lists every hotel as a card; clicking a card expands it to reveal that hotel's
 * branches (its own data is the "Main Branch") plus a "Create Branch" action.
 * Clicking any branch activates that isolated workspace via TenantContext and
 * opens the public site. Branches are full, independent restaurant workspaces.
 */
export function AdminPanelEntry() {
  const { setRestaurantById, restaurantId } = useTenant();
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [branchHotel, setBranchHotel] = useState<Restaurant | null>(null);
  const [branchForm, setBranchForm] = useState<BranchForm>(EMPTY_BRANCH);

  // Live list of hotels (parentId === null) + isolated per-hotel stats and the
  // hotel's child branches. Re-reads on any data change, so a newly created
  // workspace or branch appears instantly.
  const hotels = useLiveQuery(
    () =>
      restaurantService.listHotels().map((r) => ({
        restaurant: r,
        stats: {
          menu: menuService.items(r.id).length,
          tables: tableService.list(r.id).length,
          orders: orderService.list(r.id).length,
          staff: staffService.list(r.id).length,
        },
        branches: restaurantService.listBranches(r.id),
      })),
    { types: ['data:changed', 'order:created', 'reservation:created'] },
  );

  // Activating a workspace (hotel Main Branch or a child branch) drops the
  // visitor onto the public website (`/site`), now rendering that workspace's
  // name, branding and live data. Selection persists via TenantContext.
  function enterWorkspace(r: Restaurant) {
    setRestaurantById(r.id);
    toast.success(`Now viewing ${r.name}.`);
    navigate('/site');
  }

  function submitCreate() {
    if (!form.name.trim()) {
      toast.error('Hotel name is required.');
      return;
    }
    if (!form.ownerEmail.trim()) {
      toast.error('Owner email or username is required for login.');
      return;
    }
    const { restaurant } = restaurantService.create({
      name: form.name,
      ownerEmail: form.ownerEmail,
      ownerUsername: form.ownerUsername || undefined,
      password: form.password || undefined,
      logoColor: form.logoColor,
      description: form.description || undefined,
    });
    toast.success(`${restaurant.name} workspace created.`);
    setCreating(false);
    setForm(EMPTY_FORM);
  }

  function openBranchForm(hotel: Restaurant) {
    setBranchHotel(hotel);
    setBranchForm(EMPTY_BRANCH);
  }

  function submitBranch() {
    if (!branchHotel) return;
    if (!branchForm.name.trim()) {
      toast.error('Branch name is required.');
      return;
    }
    const branch = restaurantService.createBranch({
      hotelId: branchHotel.id,
      name: branchForm.name,
      code: branchForm.code || undefined,
      address: branchForm.address || undefined,
      phone: branchForm.phone || undefined,
      email: branchForm.email || undefined,
      manager: branchForm.manager || undefined,
      description: branchForm.description || undefined,
      status: branchForm.status,
    });
    toast.success(`${branch.name} branch created under ${branchHotel.name}.`);
    setExpandedId(branchHotel.id);
    setBranchHotel(null);
    setBranchForm(EMPTY_BRANCH);
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="absolute -top-16 right-0 -z-10 h-80 w-80 rounded-full bg-ember-200/40 blur-3xl" />
      <div className="absolute bottom-0 -left-16 -z-10 h-72 w-72 rounded-full bg-sage-100/50 blur-3xl" />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Wordmark />
        <div className="flex items-center gap-4">
          <Link to="/site" className="text-sm font-semibold text-ink-soft hover:text-ink">
            Back to website
          </Link>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ember-400 hover:text-ember-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6 sm:pt-10">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink-soft">
            <ShieldCheck className="h-3.5 w-3.5 text-ember-500" /> Hotel workspace manager
          </span>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Your <span className="text-ember-500">Hotel Workspaces</span>
          </h1>
          <p className="mt-4 max-w-md text-ink-soft">
            Each hotel is a fully isolated workspace with its own branches. Open a hotel to view its branches, enter one to manage it, or create a new hotel.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map(({ restaurant: r, stats, branches }) => {
            const expanded = expandedId === r.id;
            return (
              <div
                key={r.id}
                className="flex flex-col rounded-3xl border border-ink/8 bg-white p-6 shadow-soft transition-all"
              >
                <button
                  onClick={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                  className="flex items-center gap-3 text-left focus:outline-none"
                  aria-expanded={expanded}
                >
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl text-lg font-bold text-white"
                    style={{ background: r.logoColor }}
                  >
                    {r.logoUrl ? (
                      <img src={r.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      r.name.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-lg font-semibold leading-tight">{r.name}</h2>
                    <p className="truncate text-xs text-ink-muted">
                      {branches.length} {branches.length === 1 ? 'branch' : 'branches'} · {r.tagline ?? r.description ?? 'Hotel workspace'}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn('h-5 w-5 shrink-0 text-ink-muted transition-transform', expanded && 'rotate-180')}
                  />
                </button>

                <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                  {[
                    ['Menu', stats.menu], ['Tables', stats.tables], ['Orders', stats.orders], ['Staff', stats.staff],
                  ].map(([label, val]) => (
                    <div key={label as string} className="rounded-xl bg-cream-deep/50 py-2">
                      <div className="font-display text-base font-semibold">{val as number}</div>
                      <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
                    </div>
                  ))}
                </div>

                {expanded && (
                  <div className="mt-5 space-y-1.5 border-t border-ink/5 pt-4">
                    <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      Branches
                    </p>

                    {/* The hotel's own workspace is its Main Branch. */}
                    <button
                      onClick={() => enterWorkspace(r)}
                      className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-cream-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
                    >
                      <Home className="h-4 w-4 shrink-0 text-ember-500" />
                      <span className="flex-1 truncate text-sm font-semibold">Main Branch</span>
                      {r.id === restaurantId && <Badge tone="ember">Active</Badge>}
                      <ArrowRight className="h-4 w-4 text-ember-600 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => enterWorkspace(b)}
                        className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-cream-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.logoColor }} />
                        <span className="flex-1 truncate text-sm font-medium">
                          {b.name}
                          {b.code ? <span className="ml-1 text-xs text-ink-muted">({b.code})</span> : null}
                        </span>
                        {b.id === restaurantId && <Badge tone="ember">Active</Badge>}
                        <Badge tone={b.status === 'inactive' ? 'neutral' : 'sage'}>
                          {b.status === 'inactive' ? 'Inactive' : 'Active'}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-ember-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}

                    <button
                      onClick={() => openBranchForm(r)}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 px-2.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-ember-400 hover:text-ember-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
                    >
                      <Plus className="h-4 w-4" /> Create Branch
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Create New Hotel Workspace */}
          <button
            onClick={() => setCreating(true)}
            className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-ink/15 p-6 text-center text-ink-soft transition-colors hover:border-ember-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ember-100 text-ember-600">
              <Plus className="h-6 w-6" />
            </span>
            <span className="font-display text-lg font-semibold text-ink">Create New Hotel Workspace</span>
            <span className="text-xs text-ink-muted">Spin up a fresh, isolated hotel.</span>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Staff?{' '}
          <Link to="/login" className="font-semibold text-ember-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </main>

      {/* Create New Hotel Workspace form */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create New Hotel Workspace"
        description="A new isolated hotel with default settings, categories and tables."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={submitCreate}>
              <Building2 className="h-4 w-4" /> Create workspace
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Hotel name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. AK Restaurant"
          />
          <Input
            label="Owner email"
            type="email"
            value={form.ownerEmail}
            onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
            placeholder="owner@akrestaurant.com"
            autoComplete="off"
          />
          <Input
            label="Username (optional)"
            value={form.ownerUsername}
            onChange={(e) => setForm((f) => ({ ...f, ownerUsername: e.target.value }))}
            placeholder="ak-owner"
            autoComplete="off"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Set a login password"
            autoComplete="new-password"
          />
          <div className="flex items-end gap-3">
            <Input
              label="Brand colour"
              type="color"
              value={form.logoColor}
              onChange={(e) => setForm((f) => ({ ...f, logoColor: e.target.value }))}
              className="h-11 w-20 p-1"
            />
            <span
              className="grid h-11 w-11 place-items-center rounded-xl text-base font-bold text-white"
              style={{ background: form.logoColor }}
            >
              {(form.name || '?').charAt(0)}
            </span>
          </div>
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="A short description of this hotel."
            rows={2}
          />
        </div>
      </Modal>

      {/* Create Branch form (scoped to the selected hotel) */}
      <Modal
        open={!!branchHotel}
        onClose={() => setBranchHotel(null)}
        title={branchHotel ? `New branch for ${branchHotel.name}` : 'Create Branch'}
        description="An independent branch workspace with its own menu, tables, orders, staff and settings."
        footer={
          <>
            <Button variant="ghost" onClick={() => setBranchHotel(null)}>Cancel</Button>
            <Button onClick={submitBranch}>
              <Building2 className="h-4 w-4" /> Create branch
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Branch name"
            value={branchForm.name}
            onChange={(e) => setBranchForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Anna Nagar Branch"
          />
          <Input
            label="Branch code (optional)"
            value={branchForm.code}
            onChange={(e) => setBranchForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. ANR-01"
          />
          <Input
            label="Branch address"
            value={branchForm.address}
            onChange={(e) => setBranchForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Street, area, city"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone number"
              value={branchForm.phone}
              onChange={(e) => setBranchForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 …"
            />
            <Input
              label="Email"
              type="email"
              value={branchForm.email}
              onChange={(e) => setBranchForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="branch@hotel.com"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Branch manager"
              value={branchForm.manager}
              onChange={(e) => setBranchForm((f) => ({ ...f, manager: e.target.value }))}
              placeholder="Manager name"
            />
            <Select
              label="Status"
              value={branchForm.status}
              onChange={(e) => setBranchForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <Textarea
            label="Description (optional)"
            value={branchForm.description}
            onChange={(e) => setBranchForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="A short description of this branch."
            rows={2}
          />
        </div>
      </Modal>
    </div>
  );
}
