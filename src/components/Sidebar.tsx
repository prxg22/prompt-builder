import { useState } from 'preact/hooks'
import {
  sortedPrompts,
  activePromptId,
  loadPrompt,
  deletePrompt,
  newPrompt,
  openSaveDialog,
} from '../state/prompts'

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <path d="M2.5 4h11M5.5 4V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4M6.5 7v4M9.5 7v4" />
      <path d="M3.5 4l.5 9a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 12 13l.5-9" />
    </svg>
  )
}

function PromptItem({ prompt, isActive }: { prompt: { id: string; name: string; updatedAt: number }; isActive: boolean }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = () => {
    if (confirmDelete) {
      deletePrompt(prompt.id)
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const date = new Date(prompt.updatedAt)
  const timeStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div
      class="group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors"
      style={{
        background: isActive ? 'var(--accent-subtle)' : 'transparent',
        color: isActive ? 'var(--accent)' : 'var(--text-primary)',
      }}
      onClick={() => loadPrompt(prompt.id)}
      onDblClick={(e) => {
        e.stopPropagation()
        loadPrompt(prompt.id)
        openSaveDialog(prompt.id)
      }}
      title="Double-click to rename"
    >
      <div class="flex-1 min-w-0">
        <div class="text-sm truncate">{prompt.name}</div>
        <div class="text-xs" style={{ color: 'var(--text-secondary)' }}>{timeStr}</div>
      </div>
      <button
        class="shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--accent-hover)] transition-all"
        style={{ color: confirmDelete ? '#f85149' : 'var(--text-secondary)' }}
        onClick={(e) => { e.stopPropagation(); handleDelete() }}
        title={confirmDelete ? 'Click again to confirm' : 'Delete'}
      >
        <TrashIcon />
      </button>
    </div>
  )
}

export function Sidebar() {
  const items = sortedPrompts.value
  const activeId = activePromptId.value

  return (
    <aside
      class="flex h-56 shrink-0 flex-col border-b md:h-full md:w-72 md:border-b-0 md:border-r"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        class="flex items-center justify-between h-11 px-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span class="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Saved Prompts
        </span>
        <span class="text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-secondary)' }}>
          {items.length} {items.length === 1 ? 'prompt' : 'prompts'}
        </span>
      </div>

      <div class="flex gap-1 px-3 pt-3 pb-1">
        <button
          onClick={newPrompt}
          class="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
        >
          <PlusIcon /> New
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {items.length === 0 && (
          <div class="text-xs text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            No saved prompts yet
          </div>
        )}
        {items.map((p) => (
          <PromptItem key={p.id} prompt={p} isActive={p.id === activeId} />
        ))}
      </div>
    </aside>
  )
}
