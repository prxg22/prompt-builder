import { useState, useEffect } from 'preact/hooks'
import {
  saveDialogOpen,
  saveDialogPrompt,
  closeSaveDialog,
  renamePrompt,
} from '../state/prompts'

export function SaveDialog() {
  const isOpen = saveDialogOpen.value
  const current = saveDialogPrompt.value
  const [name, setName] = useState('')

  useEffect(() => {
    if (isOpen && current) {
      setName(current.name)
    }
  }, [isOpen, current])

  if (!isOpen || !current) return null

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    renamePrompt(current.id, trimmed)
    closeSaveDialog()
  }

  return (
    <div
      class="fixed inset-0 z-60 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={closeSaveDialog}
    >
      <div
        class="w-80 rounded-lg p-4 flex flex-col gap-3"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 class="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Rename Prompt
        </h3>

        <input
          class="w-full h-8 px-2.5 rounded-md text-sm outline-none"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          placeholder="Prompt name..."
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') closeSaveDialog()
          }}
          onFocus={(e) => (e.target as HTMLInputElement).select()}
          autoFocus
        />

        <div class="flex justify-end gap-2">
          <button
            onClick={closeSaveDialog}
            class="h-7 px-3 rounded-md text-xs font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            class="h-7 px-3 rounded-md text-xs font-medium transition-colors"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  )
}
