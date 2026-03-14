import { signal, computed } from '@preact/signals'
import { content, setContent } from './editor'
import { showToast } from './toast'

export interface Prompt {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'prompt-builder:prompts'
const ACTIVE_KEY = 'prompt-builder:active-prompt'

function loadPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistPrompts(prompts: Prompt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
}

function persistActiveId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
}

export const prompts = signal<Prompt[]>(loadPrompts())
export const activePromptId = signal<string | null>(localStorage.getItem(ACTIVE_KEY))
export const sidebarOpen = signal(false)
export const saveDialogPromptId = signal<string | null>(null)

export const activePrompt = computed(() =>
  prompts.value.find(p => p.id === activePromptId.value) ?? null
)

export const sortedPrompts = computed(() =>
  [...prompts.value].sort((a, b) => b.updatedAt - a.updatedAt)
)

export const saveDialogPrompt = computed(() =>
  prompts.value.find(p => p.id === saveDialogPromptId.value) ?? null
)

export const saveDialogOpen = computed(() => saveDialogPrompt.value !== null)

export function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

export function openSaveDialog(id = activePromptId.value) {
  if (!id) return
  saveDialogPromptId.value = id
}

export function closeSaveDialog() {
  saveDialogPromptId.value = null
}

function generateName(text: string): string {
  const firstLine = text.trim().split('\n')[0] ?? ''
  const clean = firstLine.replace(/^#+\s*/, '').trim()
  if (clean.length > 0) return clean.slice(0, 50)
  const date = new Date()
  return `Prompt ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

export function savePrompt(name?: string) {
  const now = Date.now()
  const existing = activePrompt.value

  if (existing) {
    prompts.value = prompts.value.map(p =>
      p.id === existing.id
        ? { ...p, name: name ?? p.name, content: content.value, updatedAt: now }
        : p
    )
  } else {
    const id = crypto.randomUUID()
    const prompt: Prompt = {
      id,
      name: name ?? generateName(content.value),
      content: content.value,
      createdAt: now,
      updatedAt: now,
    }
    prompts.value = [...prompts.value, prompt]
    activePromptId.value = id
    persistActiveId(id)
  }

  persistPrompts(prompts.value)
}

export function loadPrompt(id: string) {
  const prompt = prompts.value.find(p => p.id === id)
  if (!prompt) return
  setContent(prompt.content)
  activePromptId.value = id
  persistActiveId(id)
}

export function deletePrompt(id: string) {
  const prompt = prompts.value.find(p => p.id === id)
  if (!prompt) return

  prompts.value = prompts.value.filter(p => p.id !== id)
  persistPrompts(prompts.value)
  if (saveDialogPromptId.value === id) {
    closeSaveDialog()
  }
  if (activePromptId.value === id) {
    activePromptId.value = null
    persistActiveId(null)
  }

  showToast(`Deleted "${prompt.name}"`)
}

export function newPrompt() {
  closeSaveDialog()
  activePromptId.value = null
  persistActiveId(null)
  setContent('')
}

export function renamePrompt(id: string, name: string) {
  prompts.value = prompts.value.map(p =>
    p.id === id ? { ...p, name, updatedAt: Date.now() } : p
  )
  persistPrompts(prompts.value)
}

// Auto-save: debounce content changes to persist (creates new file if needed)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

content.subscribe((val) => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (!val.trim()) return

  autoSaveTimer = setTimeout(() => {
    const id = activePromptId.value
    const now = Date.now()

    if (id) {
      prompts.value = prompts.value.map(p =>
        p.id === id ? { ...p, content: val, updatedAt: now } : p
      )
      persistPrompts(prompts.value)
    } else {
      // Auto-create new prompt
      savePrompt()
      showToast('Saved')
    }
  }, 1000)
})
