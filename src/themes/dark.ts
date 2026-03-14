import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const darkColors = {
  bg: '#161b22',
  gutter: '#161b22',
  gutterText: '#484f58',
  gutterActive: '#8b949e',
  selection: 'rgba(88, 166, 255, 0.15)',
  activeLine: 'rgba(88, 166, 255, 0.06)',
  cursor: '#58a6ff',
  line: '#30363d',
}

export const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: darkColors.bg,
    color: '#e6edf3',
  },
  '.cm-content': {
    caretColor: darkColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: darkColors.cursor,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: darkColors.selection,
  },
  '.cm-activeLine': {
    backgroundColor: darkColors.activeLine,
  },
  '.cm-gutters': {
    backgroundColor: darkColors.gutter,
    color: darkColors.gutterText,
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: darkColors.gutterActive,
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#8b949e',
  },
}, { dark: true })

const darkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#ff7b72' },
  { tag: tags.comment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.string, color: '#a5d6ff' },
  { tag: tags.number, color: '#79c0ff' },
  { tag: tags.variableName, color: '#ffa657' },
  { tag: tags.definition(tags.variableName), color: '#ffa657' },
  { tag: tags.function(tags.variableName), color: '#d2a8ff' },
  { tag: tags.heading, color: '#58a6ff', fontWeight: 'bold' },
  { tag: tags.heading1, fontSize: '1.3em' },
  { tag: tags.heading2, fontSize: '1.15em' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#e6edf3' },
  { tag: tags.strong, fontWeight: 'bold', color: '#e6edf3' },
  { tag: tags.link, color: '#58a6ff' },
  { tag: tags.url, color: '#58a6ff' },
  { tag: tags.monospace, color: '#a5d6ff' },
  { tag: tags.meta, color: '#8b949e' },
  { tag: tags.quote, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.processingInstruction, color: '#ffa657' },
])

export const darkSyntax = syntaxHighlighting(darkHighlight)
