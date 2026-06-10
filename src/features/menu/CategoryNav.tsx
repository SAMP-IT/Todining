import { cn } from '@/lib/cn';

/** Sticky horizontal category pills that scroll the menu to each section. */
export function CategoryNav({
  categories,
  activeId,
  onSelect,
}: {
  categories: { id: string; name: string }[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sticky top-[57px] z-20 -mx-4 border-b border-ink/5 bg-cream/95 px-4 py-2.5 backdrop-blur">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeId === c.id ? 'bg-ink text-cream' : 'bg-white text-ink-soft hover:bg-cream-deep',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
