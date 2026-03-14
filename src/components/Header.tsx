import { useState } from 'preact/hooks'
import { content, toggleTheme, theme, toggleViewMode, viewMode } from '../state/editor'
import { copyToClipboard } from '../lib/clipboard'
import { activePrompt, openSaveDialog } from '../state/prompts'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.17 3.17l1.06 1.06M11.77 11.77l1.06 1.06M3.17 12.83l1.06-1.06M11.77 4.23l1.06-1.06" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <path d="M13.5 8.5a5.5 5.5 0 0 1-7-7A5.5 5.5 0 1 0 13.5 8.5z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M3 8.5l3.5 3.5L13 4" />
    </svg>
  )
}

function AppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 512 512" style={{ borderRadius: 4 }}>
      <rect width="512" height="512" rx="64" fill="#0d1117" />
      <rect x="32" y="32" width="448" height="448" rx="48" fill="none" stroke="#58a6ff" stroke-width="12" />
      <text x="256" y="290" font-family="system-ui,sans-serif" font-size="280" font-weight="bold" fill="#58a6ff" text-anchor="middle">P</text>
    </svg>
  )
}

function SplitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <rect x="1.5" y="2" width="13" height="12" rx="1.5" />
      <line x1="8" y1="2" x2="8" y2="14" />
    </svg>
  )
}

function FullScreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <rect x="1.5" y="2" width="13" height="12" rx="1.5" />
    </svg>
  )
}

export function Header() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(content.value)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const startEditing = () => {
    if (!activePrompt.value) return
    openSaveDialog(activePrompt.value.id)
  }

  return (
    <header
      class="flex items-center justify-between h-11 px-4 select-none shrink-0"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-app)' }}
    >
      <div class="flex items-center gap-2 min-w-0">
        <div class="shrink-0"><AppIcon /></div>
        <span
          class={`font-semibold text-sm tracking-tight truncate ${activePrompt.value ? 'cursor-pointer hover:underline' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          onClick={startEditing}
          title={activePrompt.value ? 'Click to rename' : undefined}
        >
          {activePrompt.value?.name ?? 'Prompt Builder'}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--accent-hover)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title={theme.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme.value === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <button
          onClick={handleCopy}
          class="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors"
          style={{
            background: copied ? 'rgba(63, 185, 80, 0.15)' : 'var(--accent-subtle)',
            color: copied ? 'var(--success)' : 'var(--accent)',
          }}
          title="Copy as Markdown"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? 'Copied!' : 'Copy MD'}</span>
        </button>

        <button
          onClick={toggleViewMode}
          class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--accent-hover)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title={viewMode.value === 'split' ? 'Preview only' : 'Split view'}
        >
          {viewMode.value === 'split' ? <FullScreenIcon /> : <SplitIcon />}
        </button>
      </div>
    </header>
  )
}
