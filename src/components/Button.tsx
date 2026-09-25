import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Feedback';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium';
type Size = 'lg' | 'md' | 'sm';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

export function Button({ variant = 'primary', size = 'lg', icon, trailingIcon, loading, block, className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={18} /> : icon}
      {children && <span>{children}</span>}
      {!loading && trailingIcon}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'glass' | 'surface' | 'plain' | 'accent';
  size?: number;
  pressed?: boolean;
  children: ReactNode;
}

/** Icon-only button. `label` is required for VoiceOver. */
export function IconButton({ label, variant = 'surface', size = 44, pressed, className = '', children, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={`icon-btn icon-btn--${variant} ${pressed ? 'is-on' : ''} ${className}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  );
}
