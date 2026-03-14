import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Preview } from '../src/components/Preview'
import { content, viewMode } from '../src/state/editor'
import { toasts } from '../src/state/toast'

function placeCaretAtStart(node: Node) {
  const selection = window.getSelection()
  const range = document.createRange()
  range.setStart(node, 0)
  range.collapse(true)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function createRect({
  top,
  left,
  width,
  height,
}: {
  top: number
  left: number
  width: number
  height: number
}): DOMRect {
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => '',
  } as DOMRect
}

function mockElementRect(
  element: Element,
  rect: { top: number; left: number; width: number; height: number }
) {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => createRect(rect),
  })
}

function selectText(
  node: Node,
  start: number,
  end: number,
  rect: { top: number; left: number; width: number; height: number } = {
    top: 120,
    left: 180,
    width: 64,
    height: 18,
  }
) {
  const selection = window.getSelection()
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  Object.defineProperty(range, 'getBoundingClientRect', {
    configurable: true,
    value: () => createRect(rect),
  })
  selection?.removeAllRanges()
  selection?.addRange(range)
  document.dispatchEvent(new Event('selectionchange'))
}

describe('Preview rich editor', () => {
  beforeEach(() => {
    viewMode.value = 'preview'
    content.value = '# Heading\n\nParagraph with **bold** text'
  })

  it('preserves markdown markers when rich preview input is synced back to state', async () => {
    const { container } = render(<Preview />)

    const editable = container.querySelector('.preview-editable')
    expect(editable).not.toBeNull()

    await waitFor(() => {
      expect(editable?.innerHTML).toContain('<h1')
    })

    fireEvent.input(editable as HTMLElement)

    expect(content.value).toBe('# Heading\n\nParagraph with **bold** text')
  })

  it('shows a formatting toolbar in preview mode', () => {
    const { container } = render(<Preview />)

    const toolbar = container.querySelector('[role="toolbar"][aria-label="Markdown formatting"]')
    expect(toolbar).not.toBeNull()
    expect(toolbar?.classList.contains('preview-toolbar-floating')).toBe(false)
  })

  it('shows a floating selection toolbar when text is selected', async () => {
    render(<Preview />)

    const headerToolbar = await screen.findByRole('toolbar', { name: 'Markdown formatting' })
    mockElementRect(headerToolbar, { top: 0, left: 0, width: 300, height: 40 })

    const paragraphText = await waitFor(() => {
      const textNode = document.querySelector('.preview-editable p')?.firstChild
      expect(textNode).not.toBeNull()
      return textNode as Node
    })

    selectText(paragraphText, 0, 9)

    const toolbar = await screen.findByRole('toolbar', { name: 'Selected text formatting' })
    mockElementRect(toolbar, { top: 0, left: 0, width: 112, height: 28 })
    document.dispatchEvent(new Event('selectionchange'))

    await waitFor(() => {
      expect((toolbar as HTMLElement).style.top).toBe('84px')
    })

    expect(toolbar.classList.contains('preview-selection-toolbar')).toBe(true)
    expect((toolbar as HTMLElement).style.transform).toBe('')
  })

  it('formats the active selection from the floating toolbar', async () => {
    const execCommand = vi.fn(() => true)
    document.execCommand = execCommand

    render(<Preview />)

    const paragraphText = await waitFor(() => {
      const textNode = document.querySelector('.preview-editable p')?.firstChild
      expect(textNode).not.toBeNull()
      return textNode as Node
    })

    selectText(paragraphText, 0, 9)
    fireEvent.click(await screen.findByRole('button', { name: 'Bold selected text' }))

    expect(execCommand).toHaveBeenCalledWith('bold')
  })

  it('copies the full content when copy is triggered without a selection', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    })

    const { container } = render(<Preview />)
    const editable = container.querySelector('.preview-editable') as HTMLElement

    await waitFor(() => {
      expect(editable.querySelector('h1')?.textContent).toBe('Heading')
    })

    placeCaretAtStart(editable.querySelector('h1')?.firstChild as Node)
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: 'c',
    })

    editable.dispatchEvent(event)

    await waitFor(() => {
      expect(event.defaultPrevented).toBe(true)
      expect(writeText).toHaveBeenCalledWith('# Heading\n\nParagraph with **bold** text')
      expect(toasts.value.at(-1)?.message).toBe('Copied to clipboard')
    })
  })

  it('moves the floating selection toolbar below when there is not enough space above', async () => {
    render(<Preview />)

    const headerToolbar = await screen.findByRole('toolbar', { name: 'Markdown formatting' })
    mockElementRect(headerToolbar, { top: 0, left: 0, width: 300, height: 40 })

    const paragraphText = await waitFor(() => {
      const textNode = document.querySelector('.preview-editable p')?.firstChild
      expect(textNode).not.toBeNull()
      return textNode as Node
    })

    selectText(paragraphText, 0, 9, { top: 52, left: 180, width: 64, height: 18 })

    const toolbar = await screen.findByRole('toolbar', { name: 'Selected text formatting' })
    mockElementRect(toolbar, { top: 0, left: 0, width: 112, height: 28 })
    document.dispatchEvent(new Event('selectionchange'))

    await waitFor(() => {
      expect((toolbar as HTMLElement).style.top).toBe('78px')
    })
  })

  it('removes heading formatting when backspacing at the start of the line', async () => {
    content.value = '# Heading'

    const { container } = render(<Preview />)
    const editable = container.querySelector('.preview-editable') as HTMLElement

    await waitFor(() => {
      expect(editable.querySelector('h1')?.textContent).toBe('Heading')
    })

    placeCaretAtStart(editable.querySelector('h1')?.firstChild as Node)
    fireEvent.keyDown(editable, { key: 'Backspace' })

    expect(content.value).toBe('Heading')
    expect(editable.querySelector('h1')).toBeNull()
    expect(editable.querySelector('p')?.textContent).toBe('Heading')
  })

  it('removes blockquote formatting when backspacing at the start of the line', async () => {
    content.value = '> Quote'

    const { container } = render(<Preview />)
    const editable = container.querySelector('.preview-editable') as HTMLElement

    await waitFor(() => {
      expect(editable.querySelector('blockquote p')?.textContent).toBe('Quote')
    })

    placeCaretAtStart(editable.querySelector('blockquote p')?.firstChild as Node)
    fireEvent.keyDown(editable, { key: 'Backspace' })

    expect(content.value).toBe('Quote')
    expect(editable.querySelector('blockquote')).toBeNull()
    expect(editable.querySelector('p')?.textContent).toBe('Quote')
  })

  it('removes fenced code block formatting when backspacing at the start of the line', async () => {
    content.value = '```\ncode\n```'

    const { container } = render(<Preview />)
    const editable = container.querySelector('.preview-editable') as HTMLElement

    await waitFor(() => {
      expect(editable.querySelector('pre code')?.textContent).toBe('code\n')
    })

    placeCaretAtStart(editable.querySelector('pre code')?.firstChild as Node)
    fireEvent.keyDown(editable, { key: 'Backspace' })

    expect(content.value).toBe('code')
    expect(editable.querySelector('pre')).toBeNull()
    expect(editable.querySelector('p')?.textContent).toBe('code')
  })
})
