import { describe, expect, it } from 'vitest'
import { applyMarkdownShortcuts, parseBlockMarkdownShortcut, serializeRichMarkdown } from '../src/lib/richMarkdown'

describe('rich markdown helpers', () => {
  it('parses block markdown shortcuts for headings, lists, and quotes', () => {
    expect(parseBlockMarkdownShortcut('# Heading')).toEqual({
      kind: 'heading',
      level: 1,
      text: 'Heading',
    })
    expect(parseBlockMarkdownShortcut('## Subheading')).toEqual({
      kind: 'heading',
      level: 2,
      text: 'Subheading',
    })
    expect(parseBlockMarkdownShortcut('- Bullet')).toEqual({
      kind: 'unordered-list',
      text: 'Bullet',
    })
    expect(parseBlockMarkdownShortcut('1. First')).toEqual({
      kind: 'ordered-list',
      text: 'First',
    })
    expect(parseBlockMarkdownShortcut('> Quote')).toEqual({
      kind: 'blockquote',
      text: 'Quote',
    })
  })

  it('serializes rich markdown elements back to markdown syntax', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <h1>Heading</h1>
      <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      <ul><li>First item</li><li>Second item</li></ul>
      <blockquote><p>Quoted text</p></blockquote>
    `

    expect(serializeRichMarkdown(root)).toBe(
      '# Heading\n\nParagraph with **bold** and *italic* text.\n\n- First item\n- Second item\n\n> Quoted text'
    )
  })

  it('converts root-level markdown shortcut text into a heading element', () => {
    const editor = document.createElement('div')
    editor.contentEditable = 'true'
    editor.textContent = '# Title'
    document.body.append(editor)

    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)

    expect(applyMarkdownShortcuts(editor)).toBe(true)
    expect(editor.querySelector('h1')?.textContent).toBe('Title')
  })
})
