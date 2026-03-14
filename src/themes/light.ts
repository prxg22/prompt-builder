import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const lightColors = {
  bg: '#f6f8fa',
  gutter: '#f6f8fa',
  gutterText: '#b0b8c1',
  gutterActive: '#656d76',
  selection: 'rgba(9, 105, 218, 0.12)',
  activeLine: 'rgba(9, 105, 218, 0.04)',
  cursor: '#0969da',
  line: '#d0d7de',
}

export const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: lightColors.bg,
    color: '#1f2328',
  },
  '.cm-content': {
    caretColor: lightColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: lightColors.cursor,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: lightColors.selection,
  },
  '.cm-activeLine': {
    backgroundColor: lightColors.activeLine,
  },
  '.cm-gutters': {
    backgroundColor: lightColors.gutter,
    color: lightColors.gutterText,
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: lightColors.gutterActive,
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#656d76',
  },
}, { dark: false })

const lightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#cf222e' },
  { tag: tags.comment, color: '#6e7781', fontStyle: 'italic' },
  { tag: tags.string, color: '#0a3069' },
  { tag: tags.number, color: '#0550ae' },
  { tag: tags.variableName, color: '#953800' },
  { tag: tags.definition(tags.variableName), color: '#953800' },
  { tag: tags.function(tags.variableName), color: '#8250df' },
  { tag: tags.heading, color: '#0969da', fontWeight: 'bold' },
  { tag: tags.heading1, fontSize: '1.3em' },
  { tag: tags.heading2, fontSize: '1.15em' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#1f2328' },
  { tag: tags.strong, fontWeight: 'bold', color: '#1f2328' },
  { tag: tags.link, color: '#0969da' },
  { tag: tags.url, color: '#0969da' },
  { tag: tags.monospace, color: '#0a3069' },
  { tag: tags.meta, color: '#6e7781' },
  { tag: tags.quote, color: '#6e7781', fontStyle: 'italic' },
  { tag: tags.processingInstruction, color: '#953800' },
])

export const lightSyntax = syntaxHighlighting(lightHighlight)
