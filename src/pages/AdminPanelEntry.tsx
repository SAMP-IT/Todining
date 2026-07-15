import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight, Building2, ChevronDown, GitBranch, Home, LogOut, Plus,
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
  name: '', ownerEmail: '', ownerUsername: '', password: '', logoColor: '#c0451c', description: '',
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

// Per-cell rules for the masthead totals index, by position. Every cell carries
// `border-ink/10` for colour; these only pick the SIDES, which differ between the
// 2-up phone layout and the 4-up `sm` layout. (A bare `border-r` with no colour
// class would fall back to Tailwind's default grey and break the hairline.)
const INDEX_CELL_RULES = [
  'border-r pl-0', // 0 · opens both layouts
  'sm:border-r', // 1 · ends the phone row, mid-row from sm
  'border-r border-t pl-0 sm:border-t-0 sm:pl-4', // 2 · opens the phone's 2nd row
  'border-t sm:border-t-0', // 3 · ends both layouts
];

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

  // Masthead index totals. Derived from the same live snapshot, so they track
  // creations instantly rather than needing their own query.
  const totalBranches = hotels.reduce((n, h) => n + h.branches.length, 0);
  const totalTables = hotels.reduce((n, h) => n + h.stats.tables, 0);
  const totalOrders = hotels.reduce((n, h) => n + h.stats.orders, 0);

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Wordmark />
          <div className="flex items-center gap-3 sm:gap-4">
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:pt-12">
        {/* ── Masthead ── */}
        <div className="max-w-2xl">
          <span className="flex items-center gap-3 text-[0.62rem] font-bold uppercase tracking-[0.28em] text-ink-muted">
            <span className="h-px w-8 bg-gold-400" />
            Admin Panel · Workspace manager
          </span>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,4.6vw,3.4rem)] font-semibold leading-[1.02] tracking-tight">
            Your hotel <em className="italic text-ember-500">workspaces.</em>
          </h1>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
            Each hotel is a fully isolated workspace with its own branches. Open a hotel to read its
            branches, enter one to manage it, or set up a new house.
          </p>
        </div>

        {/* A hairline index of totals, not a row of hero-metric cards. */}
        <div className="mt-8 grid grid-cols-2 border-y border-ink/10 sm:grid-cols-4">
          {[
            ['Hotels', hotels.length],
            ['Branches', totalBranches],
            ['Tables', totalTables],
            ['Orders', totalOrders],
          ].map(([label, val], i) => (
            <div
              key={label as string}
              className={cn(
                'border-ink/10 px-4 py-3.5',
                // Rules sit BETWEEN cells only, never on the row's outer edge, so
                // this reads as a printed table rather than a row of boxes. The
                // layout is 2-up on phones and 4-up from `sm`, so which cell ends
                // a row changes with the breakpoint.
                INDEX_CELL_RULES[i],
              )}
            >
              <div className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
                {label}
              </div>
              <div className="tnum mt-1 font-display text-[1.9rem] font-semibold leading-none">
                {val as number}
              </div>
            </div>
          ))}
        </div>

        {/* ── The index of houses ── */}
        <div className="mt-10 space-y-3">
          {hotels.map(({ restaurant: r, stats, branches }, i) => {
            const expanded = expandedId === r.id;
            return (
              <div key={r.id} className="rounded-xl border border-ink/10 bg-white">
                <button
                  onClick={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                  className="flex w-full items-center gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
                  aria-expanded={expanded}
                >
                  {/* Ghosted index numeral — an editorial signature, hidden on
                      phones where the row needs every pixel for the name. */}
                  <span className="tnum hidden font-display text-[1.6rem] font-semibold italic leading-none text-ink/15 sm:block">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {/* The hotel's own mark. `logoColor` is real per-tenant branding. */}
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl font-display text-lg font-semibold text-cream"
                    style={{ background: r.logoColor }}
                  >
                    {r.logoUrl ? (
                      <img src={r.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      r.name.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-xl font-semibold leading-tight">{r.name}</h2>
                    <p className="truncate text-xs text-ink-muted">
                      <span className="tnum">{branches.length}</span>{' '}
                      {branches.length === 1 ? 'branch' : 'branches'} ·{' '}
                      {r.tagline ?? r.description ?? 'Hotel workspace'}
                    </p>
                  </div>
                  {/* Per-hotel counts as a hairline strip, not four boxes. */}
                  <div className="hidden items-center lg:flex">
                    {[
                      ['Menu', stats.menu], ['Tables', stats.tables],
                      ['Orders', stats.orders], ['Staff', stats.staff],
                    ].map(([label, val]) => (
                      <div key={label as string} className="border-l border-ink/10 px-4 text-right">
                        <div className="tnum font-display text-lg font-semibold leading-none">
                          {val as number}
                        </div>
                        <div className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-ink-muted">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <ChevronDown
                    className={cn(
                      'ml-1 h-5 w-5 shrink-0 text-ink-muted transition-transform',
                      expanded && 'rotate-180',
                    )}
                  />
                </button>

                {/* Counts move inline below the name where the strip won't fit. */}
                <div className="flex flex-wrap gap-x-5 gap-y-1 px-5 pb-4 lg:hidden">
                  {[
                    ['Menu', stats.menu], ['Tables', stats.tables],
                    ['Orders', stats.orders], ['Staff', stats.staff],
                  ].map(([label, val]) => (
                    <span key={label as string} className="text-[0.7rem] font-semibold text-ink-muted">
                      {label} <span className="tnum font-display text-sm text-ink">{val as number}</span>
                    </span>
                  ))}
                </div>

                {expanded && (
                  <div className="space-y-1.5 border-t border-ink/10 px-5 py-4">
                    <p className="px-1 pb-1 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
                      Branches
                    </p>

                    {/* The hotel's own workspace is its Main Branch. */}
                    <button
                      onClick={() => enterWorkspace(r)}
                      className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-cream-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
                    >
                      <Home className="h-4 w-4 shrink-0 text-ember-500" />
                      <span className="flex-1 truncate text-sm font-semibold">Main Branch</span>
                      {r.id === restaurantId && <Badge tone="ember">Active</Badge>}
                      <ArrowRight className="h-4 w-4 shrink-0 text-ember-600 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => enterWorkspace(b)}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-cream-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
                      >
                        {/* A branch carries its parent's structure: the mark reads
                            as a child, not another house. */}
                        <GitBranch className="h-4 w-4 shrink-0 text-ink-muted" />
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.logoColor }} />
                        <span className="flex-1 truncate text-sm font-medium">
                          {b.name}
                          {b.code ? <span className="ml-1 text-xs text-ink-muted">({b.code})</span> : null}
                        </span>
                        {b.id === restaurantId && <Badge tone="ember">Active</Badge>}
                        <Badge tone={b.status === 'inactive' ? 'neutral' : 'sage'}>
                          {b.status === 'inactive' ? 'Inactive' : 'Active'}
                        </Badge>
                        <ArrowRight className="h-4 w-4 shrink-0 text-ember-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}

                    <button
                      onClick={() => openBranchForm(r)}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink/15 px-2.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-ember-400 hover:text-ember-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
                    >
                      <Plus className="h-4 w-4" /> Create Branch
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Create New Hotel Workspace — one ruled action closing the index,
              rather than a same-sized tile pretending to be a workspace. */}
          <button
            onClick={() => setCreating(true)}
            className="group flex w-full items-center gap-4 rounded-xl border border-dashed border-ink/20 p-5 text-left transition-colors hover:border-ember-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ember-100 text-ember-600">
              <Plus className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold text-ink">
                Create a new hotel workspace
              </span>
              <span className="block text-xs text-ink-muted">
                A fresh, isolated house with its own menu, tables, staff and settings.
              </span>
            </span>
            <ArrowRight className="ml-auto hidden h-4 w-4 shrink-0 text-ember-600 transition-transform group-hover:translate-x-0.5 sm:block" />
          </button>
        </div>

        <p className="mt-8 border-t border-ink/10 pt-6 text-center text-xs text-ink-muted">
          Staff?{' '}
          <Link to="/login" className="font-bold text-ember-600 hover:underline">
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
              className="grid h-11 w-11 place-items-center rounded-xl text-base font-bold text-cream"
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
