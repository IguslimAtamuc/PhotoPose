import type { ReactNode } from 'react';
import { CircleAlert, WifiOff } from 'lucide-react';

export function Spinner({ size = 24, label }: { size?: number; label?: string }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} role={label ? 'status' : undefined} aria-label={label}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden />;
}

interface StateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  secondary?: ReactNode;
  tone?: 'neutral' | 'error';
  compact?: boolean;
}

/** Shared visual for empty states and error states. */
export function StateView({ icon, title, message, action, secondary, tone = 'neutral', compact }: StateProps) {
  return (
    <div className={`state-view state-view--${tone} ${compact ? 'state-view--compact' : ''}`} role={tone === 'error' ? 'alert' : undefined}>
      <div className="state-view__icon" aria-hidden>
        {icon ?? <CircleAlert size={28} />}
      </div>
      <h2 className="state-view__title">{title}</h2>
      {message && <p className="state-view__msg">{message}</p>}
      {(action || secondary) && (
        <div className="state-view__actions">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="offline-banner" role="status">
      <WifiOff size={16} aria-hidden /> You’re offline — saved poses and history still work.
    </div>
  );
}
