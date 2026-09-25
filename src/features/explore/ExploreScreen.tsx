import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Chip, Segmented } from '@/components/Controls';
import { Skeleton, StateView } from '@/components/Feedback';
import { PoseCard } from '@/components/PoseCard';
import { Sheet } from '@/components/Sheet';
import type { Difficulty, Framing } from '@/models';
import { getServices } from '@/services/container';
import { useCatalogStore } from '@/stores/catalogStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { recommendPoses } from '../home/recommendations';
import { activeFilterCount, EMPTY_FILTERS, filterPoses, type PoseFilters, type SortKey } from './filters';
import './explore.css';

const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function ExploreScreen() {
  const [params, setParams] = useSearchParams();
  const { status, poses, categories, byId } = useCatalogStore();
  const favorites = useLibraryStore((s) => s.favorites);
  const recent = useLibraryStore((s) => s.recent);
  const [filters, setFilters] = useState<PoseFilters>(() => ({
    ...EMPTY_FILTERS,
    categoryId: params.get('c'),
    sort: (params.get('sort') as SortKey) ?? 'popular',
  }));
  const [sheet, setSheet] = useState(false);
  const query = useDeferredValue(filters.query);

  // Keep category in the URL so back/forward and deep links work.
  useEffect(() => {
    const c = params.get('c');
    if (c !== filters.categoryId) setFilters((f) => ({ ...f, categoryId: c }));
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCategory = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('c', id);
    else next.delete('c');
    setParams(next, { replace: true });
    setFilters((f) => ({ ...f, categoryId: id }));
  };

  const names = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);
  const results = useMemo(() => {
    const base = filters.sort === 'recommended' ? recommendPoses(poses, favorites, recent, byId) : poses;
    return filterPoses(base, { ...filters, query }, names);
  }, [poses, filters, query, names, favorites, recent, byId]);

  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => getServices().analytics.track('search_performed', { query, results: results.length }), 800);
    return () => clearTimeout(t);
  }, [query, results.length]);

  const count = activeFilterCount(filters);
  const category = categories.find((c) => c.id === filters.categoryId);

  return (
    <main className="screen explore">
      <header className="explore__head page-pad">
        <h1 className="t-title">{category ? category.name : 'Explore'}</h1>
        <p className="t-caption">{category ? category.description : `${poses.length} poses to try`}</p>
        <div className="search">
          <Search size={18} aria-hidden className="search__icon" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Search poses, moods, places…"
            aria-label="Search poses"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          />
          {filters.query && (
            <button className="search__clear" aria-label="Clear search" onClick={() => setFilters((f) => ({ ...f, query: '' }))}>
              <X size={16} />
            </button>
          )}
          <button className={`search__filter ${count ? 'has-count' : ''}`} aria-label={`Filters${count ? `, ${count} active` : ''}`} onClick={() => setSheet(true)}>
            <SlidersHorizontal size={18} />
            {count > 0 && <span className="search__count">{count}</span>}
          </button>
        </div>
      </header>

      <div className="chip-rail" role="toolbar" aria-label="Categories">
        <Chip selected={!filters.categoryId} onClick={() => setCategory(null)}>All</Chip>
        {categories.map((c) => (
          <Chip key={c.id} selected={filters.categoryId === c.id} onClick={() => setCategory(filters.categoryId === c.id ? null : c.id)} icon={<CategoryIcon name={c.icon} size={15} />}>
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="page-pad explore__count" aria-live="polite">
        {status === 'ready' && `${results.length} ${results.length === 1 ? 'pose' : 'poses'}`}
      </div>

      {status !== 'ready' ? (
        <div className="pose-grid page-pad">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="pose-card pose-card--grid" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <StateView
          icon={<Search size={28} />}
          title="No poses found"
          message="Try a different word or clear some filters."
          action={<Button variant="secondary" size="md" onClick={() => setFilters({ ...EMPTY_FILTERS })}>Clear all</Button>}
        />
      ) : (
        <div className="pose-grid page-pad">
          {results.map((p) => (
            <PoseCard key={p.id} pose={p} variant="grid" />
          ))}
        </div>
      )}

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filters"
        footer={
          <div className="sheet-actions">
            <Button variant="ghost" size="md" onClick={() => setFilters((f) => ({ ...EMPTY_FILTERS, query: f.query, categoryId: f.categoryId }))}>
              Reset
            </Button>
            <Button size="md" onClick={() => setSheet(false)}>
              Show {results.length} poses
            </Button>
          </div>
        }
      >
        <FilterGroup title="Sort by">
          <Segmented<SortKey>
            label="Sort by"
            value={filters.sort}
            onChange={(sort) => setFilters((f) => ({ ...f, sort }))}
            options={[
              { value: 'popular', label: 'Popular' },
              { value: 'recommended', label: 'For you' },
              { value: 'az', label: 'A–Z' },
            ]}
          />
        </FilterGroup>
        <FilterGroup title="Difficulty">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <Chip key={d} selected={filters.difficulty.includes(d)} onClick={() => setFilters((f) => ({ ...f, difficulty: toggleIn(f.difficulty, d) }))}>
              {d[0].toUpperCase() + d.slice(1)}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="Framing">
          {([['full', 'Full body'], ['half', 'Half body'], ['closeup', 'Close-up']] as [Framing, string][]).map(([v, l]) => (
            <Chip key={v} selected={filters.framing.includes(v)} onClick={() => setFilters((f) => ({ ...f, framing: toggleIn(f.framing, v) }))}>
              {l}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="People">
          {([['solo', 'Solo'], ['duo', 'Two people'], ['group', 'Group']] as const).map(([v, l]) => (
            <Chip key={v} selected={filters.people.includes(v)} onClick={() => setFilters((f) => ({ ...f, people: toggleIn(f.people, v) }))}>
              {l}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="Access">
          <Segmented
            label="Access"
            value={filters.access}
            onChange={(access) => setFilters((f) => ({ ...f, access }))}
            options={[
              { value: 'all', label: 'All' },
              { value: 'free', label: 'Free' },
              { value: 'premium', label: 'Premium' },
            ]}
          />
        </FilterGroup>
      </Sheet>
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="filter-group">
      <legend className="t-overline">{title}</legend>
      <div className="filter-group__body">{children}</div>
    </fieldset>
  );
}
