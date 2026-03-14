import { useRef, useEffect } from 'preact/hooks'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, placeholder, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { content, setContent, theme as themeSignal } from '../state/editor'
import { savePrompt } from '../state/prompts'
import { showToast } from '../state/toast'
import { darkTheme, darkSyntax } from '../themes/dark'
import { lightTheme, lightSyntax } from '../themes/light'

const themeCompartment = new Compartment()

function getThemeExtension(t: 'dark' | 'light') {
  return t === 'dark' ? [darkTheme, darkSyntax] : [lightTheme, lightSyntax]
}

export function Editor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isExternalUpdate = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: content.value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        rectangularSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        placeholder('Start writing your prompt...'),
        themeCompartment.of(getThemeExtension(themeSignal.value)),
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              savePrompt()
              showToast('Saved')
              return true
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
          ...completionKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isExternalUpdate.current) {
            setContent(update.state.doc.toString())
          }
        }),
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  // Sync theme changes
  useEffect(() => {
    const unsubscribe = themeSignal.subscribe((t) => {
      if (viewRef.current) {
        viewRef.current.dispatch({
          effects: themeCompartment.reconfigure(getThemeExtension(t)),
        })
      }
    })
    return unsubscribe
  }, [])

  // Sync external content changes (e.g. from preview editing)
  useEffect(() => {
    const unsubscribe = content.subscribe((val) => {
      const view = viewRef.current
      if (!view) return
      const current = view.state.doc.toString()
      if (current !== val) {
        isExternalUpdate.current = true
        view.dispatch({
          changes: { from: 0, to: current.length, insert: val },
        })
        isExternalUpdate.current = false
      }
    })
    return unsubscribe
  }, [])

  return (
    <div
      ref={containerRef}
      class="h-full overflow-hidden"
    />
  )
}
