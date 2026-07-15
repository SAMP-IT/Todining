import { cn } from '@/lib/cn';

type Category = { id: string; name: string };

/** Sticky horizontal category pills that scroll the menu to each section. Phone only. */
export function CategoryNav({
  categories,
  activeId,
  onSelect,
}: {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sticky top-[57px] z-20 -mx-4 border-b border-ink/10 bg-cream/95 px-4 py-2.5 backdrop-blur lg:hidden">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
              activeId === c.id
                ? 'border-ink bg-ink text-cream'
                : 'border-ink/12 bg-white text-ink-soft hover:bg-cream-deep',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The desktop counterpart: a printed-index of the menu, leader dots running to
 * the dish count. Sticks alongside the sections.
 */
export function CategoryIndex({
  categories,
  activeId,
  onSelect,
}: {
  categories: (Category & { count: number })[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="sticky top-24 hidden lg:block">
      <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink-muted">The menu</p>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            'flex w-full items-baseline gap-1.5 border-b border-ink/10 py-2 text-left text-sm font-semibold transition-colors',
            activeId === c.id ? 'text-ember-600' : 'text-ink-soft hover:text-ink',
          )}
        >
          <span>{c.name}</span>
          <span className="-translate-y-1 flex-1 border-b border-dotted border-ink/25" />
          <span className="tnum text-xs text-ink-muted">{String(c.count).padStart(2, '0')}</span>
        </button>
      ))}
    </nav>
  );
}
