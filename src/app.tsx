import { useRef, useCallback, useEffect } from 'preact/hooks'
import { viewMode } from './state/editor'
import { sidebarOpen } from './state/prompts'
import { Header } from './components/Header'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { StatusBar } from './components/StatusBar'
import { Sidebar } from './components/Sidebar'
import { SaveDialog } from './components/SaveDialog'
import { ToastContainer } from './components/Toast'
import { signal } from '@preact/signals'

const sidebarWidth = signal(288) // 18rem = 288px (md:w-72)
const editorFraction = signal(0.5)

function ResizeHandle({
  direction,
  onDrag,
}: {
  direction: 'horizontal' | 'vertical'
  onDrag: (delta: number) => void
}) {
  const dragging = useRef(false)
  const lastPos = useRef(0)

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      lastPos.current = direction === 'horizontal' ? e.clientX : e.clientY
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        const pos = direction === 'horizontal' ? ev.clientX : ev.clientY
        const delta = pos - lastPos.current
        lastPos.current = pos
        onDrag(delta)
      }

      const onMouseUp = () => {
        dragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [direction, onDrag],
  )

  return (
    <div
      class={`resize-handle ${direction === 'horizontal' ? 'resize-handle-h' : 'resize-handle-v'}`}
      onMouseDown={onMouseDown}
    />
  )
}

export function App() {
  const mode = viewMode.value
  const showSidebar = sidebarOpen.value
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSidebarResize = useCallback((delta: number) => {
    sidebarWidth.value = Math.max(180, Math.min(480, sidebarWidth.value + delta))
  }, [])

  const handleEditorResize = useCallback((delta: number) => {
    const container = containerRef.current
    if (!container) return
    const totalWidth = container.offsetWidth
    const newFraction = editorFraction.value + delta / totalWidth
    editorFraction.value = Math.max(0.2, Math.min(0.8, newFraction))
  }, [])

  const showEditor = mode === 'split' || mode === 'editor'
  const showPreview = mode === 'split' || mode === 'preview'

  return (
    <div class="flex flex-col h-screen" style={{ background: 'var(--bg-app)' }}>
      <ToastContainer />
      <SaveDialog />
      <Header />

      <main class="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
        {showSidebar && (
          <>
            <aside
              class="flex h-56 shrink-0 flex-col border-b md:h-full md:border-b-0 md:border-r"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                width: undefined,
                [`--sidebar-w` as string]: `${sidebarWidth.value}px`,
              }}
            >
              <Sidebar />
            </aside>
            <ResizeHandle direction="horizontal" onDrag={handleSidebarResize} />
          </>
        )}

        <div ref={containerRef} class="flex min-h-0 flex-1 flex-col md:flex-row">
          {showEditor && (
            <div
              data-pane="editor"
              class="min-h-0 border-b md:border-b-0 md:border-r"
              style={{
                borderColor: 'var(--border)',
                flex: mode === 'split' ? `0 0 ${editorFraction.value * 100}%` : '1 1 100%',
              }}
            >
              <Editor />
            </div>
          )}

          {mode === 'split' && (
            <ResizeHandle direction="horizontal" onDrag={handleEditorResize} />
          )}

          {showPreview && (
            <div
              data-pane="preview"
              class="min-h-0 flex-1"
            >
              <Preview />
            </div>
          )}
        </div>
      </main>

      <StatusBar />
    </div>
  )
}
