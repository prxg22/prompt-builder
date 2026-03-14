import { viewMode } from './state/editor'
import { Header } from './components/Header'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { StatusBar } from './components/StatusBar'
import { Sidebar } from './components/Sidebar'
import { SaveDialog } from './components/SaveDialog'
import { ToastContainer } from './components/Toast'

export function App() {
  const isSplit = viewMode.value === 'split'

  return (
    <div class="flex flex-col h-screen" style={{ background: 'var(--bg-app)' }}>
      <ToastContainer />
      <SaveDialog />
      <Header />

      <main class="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
        <Sidebar />

        <div class="flex min-h-0 flex-1 flex-col md:flex-row">
          {isSplit && (
            <div
              data-pane="editor"
              class="min-h-0 w-full flex-1 border-b md:w-1/2 md:border-b-0 md:border-r"
              style={{
                borderColor: 'var(--border)',
              }}
            >
              <Editor />
            </div>
          )}

          <div
            data-pane="preview"
            class={`min-h-0 flex-1 ${isSplit ? 'w-full md:w-1/2' : 'w-full'}`}
          >
            <Preview />
          </div>
        </div>
      </main>

      <StatusBar />
    </div>
  )
}
