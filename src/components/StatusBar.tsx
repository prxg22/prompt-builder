import { charCount, wordCount, lineCount } from '../state/editor'

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7v3.5" stroke-linecap="round" />
      <circle cx="8" cy="4.75" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function StatusBar() {
  return (
    <footer
      class="flex items-center justify-between h-7 px-4 text-xs select-none shrink-0"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-app)',
        color: 'var(--text-secondary)',
      }}
    >
      <div class="flex items-center gap-3">
        <span>{charCount.value} chars</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>{wordCount.value} words</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>{lineCount.value} lines</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          aria-label="Markdown shortcuts"
          title="Type # Title for H1, ## for H2, > for quotes, - for bullets, and 1. for numbered lists."
          class="flex h-5 w-5 items-center justify-center rounded-full border transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'help',
          }}
        >
          <InfoIcon />
        </button>
      </div>
    </footer>
  )
}
