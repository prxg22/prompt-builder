import { toasts } from '../state/toast'

export function ToastContainer() {
  const items = toasts.value
  if (items.length === 0) return null

  return (
    <div class="fixed bottom-12 left-1/2 z-[100] flex flex-col items-center gap-2 -translate-x-1/2 pointer-events-none">
      {items.map(t => (
        <div
          key={t.id}
          class="px-3 py-1.5 rounded-md text-xs font-medium animate-[toast-in_150ms_ease-out]"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
