import { useRef, useEffect, useState } from 'preact/hooks'
import { content, setContent } from '../state/editor'
import { renderMarkdown } from '../lib/markdown'
import { copyToClipboard } from '../lib/clipboard'
import {
  applyMarkdownShortcuts,
  applyToolbarAction,
  removeBlockFormattingAtSelection,
  serializeRichMarkdown,
  type ToolbarAction,
} from '../lib/richMarkdown'

function toolbarActions(): Array<{ label: string; title: string; action: ToolbarAction }> {
  return [
    { label: 'H1', title: 'Heading 1', action: { kind: 'heading', level: 1 } },
    { label: 'H2', title: 'Heading 2', action: { kind: 'heading', level: 2 } },
    { label: 'H3', title: 'Heading 3', action: { kind: 'heading', level: 3 } },
    { label: 'B', title: 'Bold', action: { kind: 'bold' } },
    { label: 'I', title: 'Italic', action: { kind: 'italic' } },
    { label: '</>', title: 'Inline code', action: { kind: 'inline-code' } },
    { label: '"', title: 'Blockquote', action: { kind: 'blockquote' } },
    { label: '•', title: 'Bulleted list', action: { kind: 'unordered-list' } },
    { label: '1.', title: 'Numbered list', action: { kind: 'ordered-list' } },
  ]
}

function selectionToolbarActions(): Array<{ label: string; title: string; action: ToolbarAction }> {
  return [
    { label: 'B', title: 'Bold selected text', action: { kind: 'bold' } },
    { label: 'I', title: 'Italic selected text', action: { kind: 'italic' } },
    { label: '</>', title: 'Code selected text', action: { kind: 'inline-code' } },
  ]
}

type SelectionToolbarPosition = {
  selectionTop: number
  selectionBottom: number
  centerX: number
  top: number
  left: number
}

const SELECTION_TOOLBAR_GAP = 8
const SELECTION_TOOLBAR_ESTIMATED_WIDTH = 112
const SELECTION_TOOLBAR_ESTIMATED_HEIGHT = 28

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function Preview() {
  const shellRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const headerToolbarRef = useRef<HTMLDivElement>(null)
  const selectionToolbarRef = useRef<HTMLDivElement>(null)
  const lastSyncedMarkdownRef = useRef(content.value)
  const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbarPosition | null>(null)

  const syncFromEditor = () => {
    if (!containerRef.current) return
    const markdown = serializeRichMarkdown(containerRef.current)
    lastSyncedMarkdownRef.current = markdown
    setContent(markdown)
  }

  const updateSelectionToolbar = () => {
    const editor = containerRef.current
    const shell = shellRef.current
    if (!editor || !shell) {
      setSelectionToolbar(null)
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectionToolbar(null)
      return
    }

    if (!editor.contains(selection.anchorNode) || !editor.contains(selection.focusNode)) {
      setSelectionToolbar(null)
      return
    }

    const selectedText = selection.toString()
    if (!selectedText.length) {
      setSelectionToolbar(null)
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (!rect.width && !rect.height) {
      setSelectionToolbar(null)
      return
    }

    const shellRect = shell.getBoundingClientRect()
    const selectionTop = rect.top - shellRect.top
    const selectionBottom = rect.bottom - shellRect.top
    const centerX = rect.left + rect.width / 2 - shellRect.left
    const headerHeight = headerToolbarRef.current?.getBoundingClientRect().height ?? 0
    const toolbarRect = selectionToolbarRef.current?.getBoundingClientRect()
    const toolbarHeight = toolbarRect?.height || SELECTION_TOOLBAR_ESTIMATED_HEIGHT
    const toolbarWidth = toolbarRect?.width || SELECTION_TOOLBAR_ESTIMATED_WIDTH
    const shellWidth = shellRect.width || editor.getBoundingClientRect().width || window.innerWidth
    const minLeft = toolbarWidth / 2 + SELECTION_TOOLBAR_GAP
    const maxLeft = Math.max(minLeft, shellWidth - toolbarWidth / 2 - SELECTION_TOOLBAR_GAP)
    const left = clamp(centerX, minLeft, maxLeft)
    const fitsAbove =
      selectionTop - toolbarHeight - SELECTION_TOOLBAR_GAP >= headerHeight + SELECTION_TOOLBAR_GAP
    const top = fitsAbove
      ? selectionTop - toolbarHeight - SELECTION_TOOLBAR_GAP
      : selectionBottom + SELECTION_TOOLBAR_GAP

    setSelectionToolbar((current) => {
      if (
        current?.selectionTop === selectionTop &&
        current.selectionBottom === selectionBottom &&
        current.centerX === centerX &&
        current.top === top &&
        current.left === left
      ) {
        return current
      }
      return { selectionTop, selectionBottom, centerX, top, left }
    })
  }

  useEffect(() => {
    if (!containerRef.current) return
    if (content.value !== lastSyncedMarkdownRef.current) {
      containerRef.current.innerHTML = renderMarkdown(content.value)
      lastSyncedMarkdownRef.current = content.value
    }
  }, [content.value])

  useEffect(() => {
    if (!selectionToolbar) return
    updateSelectionToolbar()
  }, [selectionToolbar?.selectionTop, selectionToolbar?.selectionBottom, selectionToolbar?.centerX])

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = renderMarkdown(content.value)

    const handleInput = () => {
      if (!containerRef.current) return
      applyMarkdownShortcuts(containerRef.current)
      syncFromEditor()
      updateSelectionToolbar()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return

      if (event.key === 'Backspace' && removeBlockFormattingAtSelection(containerRef.current)) {
        event.preventDefault()
        syncFromEditor()
        updateSelectionToolbar()
        return
      }

      if (!(event.metaKey || event.ctrlKey)) return

      const key = event.key.toLowerCase()
      if (key === 'c') {
        const selection = window.getSelection()
        const hasSelection = Boolean(selection && !selection.isCollapsed && selection.toString().length)

        if (hasSelection) return

        event.preventDefault()
        void copyToClipboard(serializeRichMarkdown(containerRef.current))
        return
      }

      const action =
        key === 'b'
          ? { kind: 'bold' as const }
          : key === 'i'
            ? { kind: 'italic' as const }
            : null

      if (!action) return
      event.preventDefault()
      if (applyToolbarAction(containerRef.current, action)) {
        syncFromEditor()
        updateSelectionToolbar()
      }
    }

    const handleSelectionChange = () => {
      updateSelectionToolbar()
    }

    containerRef.current.addEventListener('input', handleInput)
    containerRef.current.addEventListener('keydown', handleKeyDown)
    containerRef.current.addEventListener('mouseup', handleSelectionChange)
    containerRef.current.addEventListener('keyup', handleSelectionChange)
    containerRef.current.addEventListener('scroll', handleSelectionChange)
    document.addEventListener('selectionchange', handleSelectionChange)
    window.addEventListener('resize', handleSelectionChange)

    return () => {
      containerRef.current?.removeEventListener('input', handleInput)
      containerRef.current?.removeEventListener('keydown', handleKeyDown)
      containerRef.current?.removeEventListener('mouseup', handleSelectionChange)
      containerRef.current?.removeEventListener('keyup', handleSelectionChange)
      containerRef.current?.removeEventListener('scroll', handleSelectionChange)
      document.removeEventListener('selectionchange', handleSelectionChange)
      window.removeEventListener('resize', handleSelectionChange)
    }
  }, [])

  const handleToolbarClick = (action: ToolbarAction) => {
    if (!containerRef.current) return
    if (applyToolbarAction(containerRef.current, action)) {
      syncFromEditor()
      updateSelectionToolbar()
    }
  }

  return (
    <div
      ref={shellRef}
      class="preview-shell relative flex h-full min-h-0 flex-col"
      style={{ background: 'var(--bg-elevated)' }}
    >
      <div
        ref={headerToolbarRef}
        class="preview-toolbar flex items-center gap-1 overflow-x-auto px-3 py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
        role="toolbar"
        aria-label="Markdown formatting"
      >
        {toolbarActions().map((item) => (
          <button
            key={item.title}
            type="button"
            class="preview-toolbar-button rounded-md px-2 py-1 text-xs font-medium"
            title={item.title}
            aria-label={item.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleToolbarClick(item.action)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {selectionToolbar && (
        <div
          ref={selectionToolbarRef}
          class="preview-toolbar preview-selection-toolbar flex items-center overflow-x-auto"
          role="toolbar"
          aria-label="Selected text formatting"
          style={{
            top: `${selectionToolbar.top}px`,
            left: `${selectionToolbar.left}px`,
          }}
        >
          {selectionToolbarActions().map((item) => (
            <button
              key={item.title}
              type="button"
              class="preview-toolbar-button rounded-md px-2 py-1 text-xs font-medium"
              title={item.title}
              aria-label={item.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleToolbarClick(item.action)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        class="markdown-body preview-editable h-full flex-1 overflow-y-auto p-6"
        contentEditable
        spellcheck
        style={{
          background: 'var(--bg-elevated)',
          outline: 'none',
        }}
      />
    </div>
  )
}
