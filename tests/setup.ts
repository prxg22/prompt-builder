import { cleanup } from '@testing-library/preact'
import { afterEach, beforeEach } from 'vitest'
import { toasts } from '../src/state/toast'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-theme')
  toasts.value = []
})
