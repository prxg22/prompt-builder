import { render, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { Editor } from '../src/components/Editor'
import { content } from '../src/state/editor'
import { toasts } from '../src/state/toast'

describe('Editor copy behavior', () => {
  it('copies the full content when copy is triggered without a selection', async () => {
    content.value = '# Heading\n\nParagraph with **bold** text'

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    })

    const { container } = render(<Editor />)

    const contentElement = await waitFor(() => {
      const node = container.querySelector('.cm-content') as HTMLElement | null
      expect(node).not.toBeNull()
      return node as HTMLElement
    })

    contentElement.focus()
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: 'c',
    })

    contentElement.dispatchEvent(event)

    await waitFor(() => {
      expect(event.defaultPrevented).toBe(true)
      expect(writeText).toHaveBeenCalledWith('# Heading\n\nParagraph with **bold** text')
      expect(toasts.value.at(-1)?.message).toBe('Copied to clipboard')
    })
  })
})
