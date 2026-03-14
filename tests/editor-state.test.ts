import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('editor state defaults', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('starts with empty content instead of the welcome intro', async () => {
    const editorState = await import('../src/state/editor')

    expect(editorState.content.value).toBe('')
  })
})
