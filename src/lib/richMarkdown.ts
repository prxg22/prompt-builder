import { marked } from 'marked'
import { highlightVariables } from './markdown'

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type BlockMarkdownShortcut =
  | { kind: 'heading'; level: HeadingLevel; text: string }
  | { kind: 'unordered-list'; text: string }
  | { kind: 'ordered-list'; text: string }
  | { kind: 'blockquote'; text: string }

const BLOCK_TAGS = new Set([
  'blockquote',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'ol',
  'p',
  'pre',
  'ul',
])

const INLINE_MARKDOWN_PATTERN = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/

export function parseBlockMarkdownShortcut(text: string): BlockMarkdownShortcut | null {
  const normalized = text.replace(/\u00a0/g, ' ').trim()
  if (!normalized) return null

  const headingMatch = normalized.match(/^(#{1,6})\s+(.+)$/)
  if (headingMatch) {
    return {
      kind: 'heading',
      level: headingMatch[1].length as HeadingLevel,
      text: headingMatch[2].trim(),
    }
  }

  const blockquoteMatch = normalized.match(/^>\s+(.+)$/)
  if (blockquoteMatch) {
    return { kind: 'blockquote', text: blockquoteMatch[1].trim() }
  }

  const unorderedListMatch = normalized.match(/^[-*]\s+(.+)$/)
  if (unorderedListMatch) {
    return { kind: 'unordered-list', text: unorderedListMatch[1].trim() }
  }

  const orderedListMatch = normalized.match(/^\d+\.\s+(.+)$/)
  if (orderedListMatch) {
    return { kind: 'ordered-list', text: orderedListMatch[1].trim() }
  }

  return null
}

export function serializeRichMarkdown(root: ParentNode): string {
  const lines = Array.from(root.childNodes)
    .map((node) => serializeBlock(node))
    .filter((block): block is string => Boolean(block && block.trim()))

  return lines.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function applyMarkdownShortcuts(editor: HTMLElement): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  const currentBlock =
    findClosestBlock(selection.anchorNode, editor) ??
    normalizeRootContentIntoParagraph(editor, selection.anchorNode)
  if (!currentBlock) return false

  if (applyBlockShortcut(currentBlock)) return true
  return applyInlineShortcut(currentBlock)
}

export function removeBlockFormattingAtSelection(editor: HTMLElement): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false

  const range = selection.getRangeAt(0)
  if (!editor.contains(range.startContainer)) return false

  const target = findBlockFormattingTarget(range.startContainer, editor)
  if (!target) return false

  const startBoundary = target.kind === 'blockquote' ? target.line : target.element
  if (!isRangeAtStartOfNode(range, startBoundary)) return false

  switch (target.kind) {
    case 'heading':
      unwrapElementToParagraph(target.element)
      return true
    case 'blockquote':
      unwrapBlockquoteLine(target.element, target.line)
      return true
    case 'pre':
      unwrapPreformattedBlock(target.element)
      return true
  }
}

export function applyToolbarAction(editor: HTMLElement, action: ToolbarAction): boolean {
  editor.focus()

  if (action.kind === 'inline-code') {
    return wrapSelectionInCode(editor)
  }

  if (typeof document.execCommand !== 'function') return false

  switch (action.kind) {
    case 'bold':
      return document.execCommand('bold')
    case 'italic':
      return document.execCommand('italic')
    case 'heading':
      return document.execCommand('formatBlock', false, `<h${action.level}>`)
    case 'blockquote':
      return document.execCommand('formatBlock', false, '<blockquote>')
    case 'unordered-list':
      return document.execCommand('insertUnorderedList')
    case 'ordered-list':
      return document.execCommand('insertOrderedList')
  }
}

export type ToolbarAction =
  | { kind: 'heading'; level: HeadingLevel }
  | { kind: 'bold' }
  | { kind: 'italic' }
  | { kind: 'inline-code' }
  | { kind: 'blockquote' }
  | { kind: 'unordered-list' }
  | { kind: 'ordered-list' }

type BlockFormattingTarget =
  | { kind: 'heading'; element: HTMLElement }
  | { kind: 'blockquote'; element: HTMLElement; line: HTMLElement }
  | { kind: 'pre'; element: HTMLElement }

function applyBlockShortcut(block: HTMLElement): boolean {
  if (!['div', 'p'].includes(block.tagName.toLowerCase())) return false

  const shortcut = parseBlockMarkdownShortcut(block.textContent ?? '')
  if (!shortcut) return false

  const replacement = document.createElement(
    shortcut.kind === 'heading'
      ? `h${shortcut.level}`
      : shortcut.kind === 'blockquote'
        ? 'blockquote'
        : shortcut.kind === 'unordered-list'
          ? 'ul'
          : 'ol'
  )

  if (shortcut.kind === 'blockquote') {
    const paragraph = document.createElement('p')
    paragraph.textContent = shortcut.text
    replacement.append(paragraph)
  } else if (shortcut.kind === 'unordered-list' || shortcut.kind === 'ordered-list') {
    const item = document.createElement('li')
    item.textContent = shortcut.text
    replacement.append(item)
  } else {
    replacement.textContent = shortcut.text
  }

  block.replaceWith(replacement)
  placeCaretAtEnd(replacement)
  return true
}

function applyInlineShortcut(block: HTMLElement): boolean {
  if (!INLINE_MARKDOWN_PATTERN.test(block.textContent ?? '')) return false

  const containsBlockChildren = Array.from(block.children).some((child) =>
    BLOCK_TAGS.has(child.tagName.toLowerCase())
  )
  if (containsBlockChildren) return false

  const rendered = marked.parseInline(block.textContent ?? '', { async: false }) as string
  const nextHtml = highlightVariables(rendered)
  if (block.innerHTML === nextHtml) return false

  block.innerHTML = nextHtml
  placeCaretAtEnd(block)
  return true
}

function findClosestBlock(node: Node | null, root: HTMLElement): HTMLElement | null {
  let current = node instanceof HTMLElement ? node : node?.parentElement ?? null

  while (current && current !== root) {
    if (BLOCK_TAGS.has(current.tagName.toLowerCase())) return current
    current = current.parentElement
  }

  return null
}

function normalizeRootContentIntoParagraph(editor: HTMLElement, anchorNode: Node | null): HTMLElement | null {
  if (!anchorNode) return null

  const isRootSelection =
    anchorNode === editor ||
    (anchorNode.parentNode === editor && anchorNode.nodeType === Node.TEXT_NODE)

  if (!isRootSelection) return null

  const hasBlockChildren = Array.from(editor.children).some((child) =>
    BLOCK_TAGS.has(child.tagName.toLowerCase())
  )
  if (hasBlockChildren) return null

  const paragraph = document.createElement('p')
  while (editor.firstChild) {
    paragraph.append(editor.firstChild)
  }
  editor.append(paragraph)
  placeCaretAtEnd(paragraph)
  return paragraph
}

function wrapSelectionInCode(editor: HTMLElement): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false

  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false

  const code = document.createElement('code')

  try {
    range.surroundContents(code)
  } catch {
    const fragment = range.extractContents()
    code.append(fragment)
    range.insertNode(code)
  }

  selection.removeAllRanges()
  const nextRange = document.createRange()
  nextRange.selectNodeContents(code)
  nextRange.collapse(false)
  selection.addRange(nextRange)
  return true
}

function placeCaretAtEnd(element: HTMLElement) {
  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()
  range.selectNodeContents(element)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function placeCaretAtStart(element: HTMLElement) {
  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()
  range.selectNodeContents(element)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

function findBlockFormattingTarget(node: Node | null, root: HTMLElement): BlockFormattingTarget | null {
  let current = node instanceof HTMLElement ? node : node?.parentElement ?? null

  while (current && current !== root) {
    const tag = current.tagName.toLowerCase()

    if (/^h[1-6]$/.test(tag)) {
      return { kind: 'heading', element: current }
    }

    if (tag === 'pre') {
      return { kind: 'pre', element: current }
    }

    if (tag === 'blockquote') {
      const line = findDirectChildLine(current, node)
      return line ? { kind: 'blockquote', element: current, line } : null
    }

    current = current.parentElement
  }

  return null
}

function findDirectChildLine(blockquote: HTMLElement, node: Node | null): HTMLElement | null {
  let current = node instanceof HTMLElement ? node : node?.parentElement ?? null

  while (current && current !== blockquote) {
    if (current.parentElement === blockquote) return current
    current = current.parentElement
  }

  return null
}

function isRangeAtStartOfNode(range: Range, root: Node): boolean {
  if (range.startContainer !== root && !root.contains(range.startContainer)) return false

  const prefix = document.createRange()
  prefix.selectNodeContents(root)
  prefix.setEnd(range.startContainer, range.startOffset)
  return prefix.toString().length === 0
}

function unwrapElementToParagraph(element: HTMLElement): HTMLParagraphElement {
  const paragraph = document.createElement('p')

  while (element.firstChild) {
    paragraph.append(element.firstChild)
  }

  element.replaceWith(paragraph)
  placeCaretAtStart(paragraph)
  return paragraph
}

function unwrapBlockquoteLine(blockquote: HTMLElement, line: HTMLElement) {
  const paragraph = document.createElement('p')

  while (line.firstChild) {
    paragraph.append(line.firstChild)
  }

  const childBlocks = Array.from(blockquote.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  )
  const lineIndex = childBlocks.indexOf(line)

  if (lineIndex === -1) {
    blockquote.replaceWith(paragraph)
    placeCaretAtStart(paragraph)
    return
  }

  const fragment = document.createDocumentFragment()
  const before = childBlocks.slice(0, lineIndex)
  const after = childBlocks.slice(lineIndex + 1)

  if (before.length > 0) {
    const beforeQuote = document.createElement('blockquote')
    before.forEach((child) => beforeQuote.append(child))
    fragment.append(beforeQuote)
  }

  fragment.append(paragraph)

  if (after.length > 0) {
    const afterQuote = document.createElement('blockquote')
    after.forEach((child) => afterQuote.append(child))
    fragment.append(afterQuote)
  }

  blockquote.replaceWith(fragment)
  placeCaretAtStart(paragraph)
}

function unwrapPreformattedBlock(element: HTMLElement) {
  const paragraph = document.createElement('p')
  const text = (element.querySelector('code')?.textContent ?? element.textContent ?? '').replace(/\n$/, '')

  text.split('\n').forEach((line, index) => {
    if (index > 0) paragraph.append(document.createElement('br'))
    paragraph.append(document.createTextNode(line))
  })

  element.replaceWith(paragraph)
  placeCaretAtStart(paragraph)
}

function serializeBlock(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeText(node.textContent ?? '')
    return text.trim()
  }

  if (!(node instanceof HTMLElement)) return ''

  const tag = node.tagName.toLowerCase()

  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag[1])
    return `${'#'.repeat(level)} ${serializeInline(node).trim()}`
  }

  switch (tag) {
    case 'p':
      return serializeInline(node).trim()
    case 'blockquote':
      return serializeContainer(node)
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n')
    case 'ul':
      return serializeList(node, 'unordered')
    case 'ol':
      return serializeList(node, 'ordered')
    case 'pre': {
      const code = node.querySelector('code')?.textContent ?? node.textContent ?? ''
      const normalized = code.replace(/\n$/, '')
      return `\`\`\`\n${normalized}\n\`\`\``
    }
    case 'hr':
      return '---'
    case 'div':
      if (Array.from(node.children).some((child) => BLOCK_TAGS.has(child.tagName.toLowerCase()))) {
        return serializeContainer(node)
      }
      return serializeInline(node).trim()
    default:
      return serializeContainer(node) || serializeInline(node).trim()
  }
}

function serializeContainer(root: HTMLElement): string {
  return Array.from(root.childNodes)
    .map((child) => serializeBlock(child))
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function serializeList(list: HTMLElement, kind: 'unordered' | 'ordered', depth = 0): string {
  return Array.from(list.children)
    .filter((child): child is HTMLLIElement => child instanceof HTMLLIElement)
    .map((item, index) => {
      const prefix = kind === 'ordered' ? `${index + 1}. ` : '- '
      const indent = '  '.repeat(depth)
      const lines: string[] = []
      const inlineParts: string[] = []

      Array.from(item.childNodes).forEach((child) => {
        if (child instanceof HTMLElement && ['ol', 'ul'].includes(child.tagName.toLowerCase())) {
          const nested = serializeList(
            child,
            child.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered',
            depth + 1
          )
          if (nested) lines.push(nested)
          return
        }

        const serialized = child instanceof HTMLElement && child.tagName.toLowerCase() === 'p'
          ? serializeInline(child).trim()
          : child instanceof HTMLElement
            ? serializeBlock(child).trim()
            : normalizeText(child.textContent ?? '').trim()

        if (serialized) inlineParts.push(serialized)
      })

      const firstLine = `${indent}${prefix}${inlineParts.join(' ').trim()}`.trimEnd()
      return [firstLine, ...lines].filter(Boolean).join('\n')
    })
    .filter(Boolean)
    .join('\n')
}

function serializeInline(root: HTMLElement): string {
  return Array.from(root.childNodes)
    .map((child) => serializeInlineNode(child))
    .join('')
    .replace(/\u00a0/g, ' ')
}

function serializeInlineNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeText(node.textContent ?? '')
  }

  if (!(node instanceof HTMLElement)) return ''

  if (node.classList.contains('prompt-var') && node.dataset.varId) {
    return `{{vars://${node.dataset.varId}/}}`
  }

  const tag = node.tagName.toLowerCase()

  switch (tag) {
    case 'strong':
    case 'b':
      return `**${serializeInline(node)}**`
    case 'em':
    case 'i':
      return `*${serializeInline(node)}*`
    case 'code':
      return `\`${(node.textContent ?? '').replace(/`/g, '\\`')}\``
    case 'a': {
      const text = serializeInline(node)
      const href = node.getAttribute('href') ?? ''
      return href ? `[${text}](${href})` : text
    }
    case 'br':
      return '  \n'
    default:
      return serializeInline(node)
  }
}

function normalizeText(value: string): string {
  return value.replace(/\u00a0/g, ' ')
}
