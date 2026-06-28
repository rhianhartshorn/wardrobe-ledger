import { AlertCircle, X } from 'lucide-react';

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 text-xs font-light px-3 py-2.5 mb-3">
      <AlertCircle size={13} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss"><X size={13} /></button>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.15em] text-[#6B6058] font-light mb-1.5">{label}</span>
      {children}
    </label>
  );
}
