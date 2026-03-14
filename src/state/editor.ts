import { signal, computed } from '@preact/signals'

export type ViewMode = 'split' | 'preview'
export type Theme = 'dark' | 'light'

const DEFAULT_CONTENT = ''

export const content = signal(DEFAULT_CONTENT)
export const viewMode = signal<ViewMode>('split')
export const theme = signal<Theme>('dark')

export const charCount = computed(() => content.value.length)
export const wordCount = computed(() => {
  const text = content.value.trim()
  if (!text) return 0
  return text.split(/\s+/).length
})
export const lineCount = computed(() => {
  if (!content.value) return 0
  return content.value.split('\n').length
})

export function toggleViewMode() {
  viewMode.value = viewMode.value === 'split' ? 'preview' : 'split'
}

export function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  theme.value = next
  document.documentElement.setAttribute('data-theme', next)
}

export function setContent(value: string) {
  content.value = value
}
