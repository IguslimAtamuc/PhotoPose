import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
          {t.tone === 'success' ? <CircleCheck size={18} /> : t.tone === 'error' ? <CircleAlert size={18} /> : <Info size={18} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
