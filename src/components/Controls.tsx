import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__knob" />
    </button>
  );
}

export function Chip({ selected, onClick, children, icon }: { selected?: boolean; onClick?: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <button className={`chip ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} role="radio" aria-checked={o.value === value} className={o.value === value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface RowProps {
  icon?: ReactNode;
  label: string;
  detail?: string;
  value?: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  chevron?: boolean;
}

/** Settings-style list row. Renders a button when interactive. */
export function ListRow({ icon, label, detail, value, onClick, href, danger, chevron = !!onClick || !!href }: RowProps) {
  const body = (
    <>
      {icon && <span className="list-row__icon" aria-hidden>{icon}</span>}
      <span className="list-row__text">
        <span className={`list-row__label ${danger ? 'is-danger' : ''}`}>{label}</span>
        {detail && <span className="list-row__detail">{detail}</span>}
      </span>
      {value !== undefined && <span className="list-row__value">{value}</span>}
      {chevron && <ChevronRight size={18} className="list-row__chev" aria-hidden />}
    </>
  );
  if (href) {
    return (
      <a className="list-row is-interactive" href={href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button className="list-row is-interactive" onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className="list-row">{body}</div>;
}

export function ListGroup({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  return (
    <section className="list-group">
      {title && <h2 className="list-group__title t-overline">{title}</h2>}
      <div className="list-group__body">{children}</div>
      {footer && <p className="list-group__footer">{footer}</p>}
    </section>
  );
}
