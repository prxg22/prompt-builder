import { signal } from '@preact/signals'

export interface Toast {
  id: number
  message: string
}

let nextId = 0
export const toasts = signal<Toast[]>([])

export function showToast(message: string, duration = 2000) {
  const id = nextId++
  toasts.value = [...toasts.value, { id, message }]
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}
