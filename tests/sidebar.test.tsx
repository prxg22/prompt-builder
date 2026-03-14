import { fireEvent, render, screen, within } from '@testing-library/preact'
import { beforeEach, describe, expect, it } from 'vitest'
import { Sidebar } from '../src/components/Sidebar'
import { SaveDialog } from '../src/components/SaveDialog'
import { ToastContainer } from '../src/components/Toast'
import { setContent } from '../src/state/editor'
import { activePromptId, prompts } from '../src/state/prompts'

describe('saved prompts sidebar', () => {
  beforeEach(() => {
    prompts.value = [
      {
        id: 'prompt-1',
        name: 'First Prompt',
        content: '# First',
        createdAt: 1,
        updatedAt: 2,
      },
      {
        id: 'prompt-2',
        name: 'Second Prompt',
        content: '# Second',
        createdAt: 3,
        updatedAt: 4,
      },
    ]
    activePromptId.value = 'prompt-1'
    setContent('# First')
  })

  it('renders the prompt list without toggling it open first', () => {
    render(<Sidebar />)

    expect(screen.getByText('Saved Prompts')).toBeTruthy()
    expect(screen.getByText('First Prompt')).toBeTruthy()
  })

  it('opens the rename dialog when a prompt is double-clicked', () => {
    render(
      <>
        <Sidebar />
        <SaveDialog />
      </>
    )

    fireEvent.dblClick(screen.getByText('Second Prompt'))

    expect(screen.getByRole('heading', { name: 'Rename Prompt' })).toBeTruthy()
    expect(screen.getByDisplayValue('Second Prompt')).toBeTruthy()
  })

  it('shows a toast after confirming deletion', () => {
    render(
      <>
        <Sidebar />
        <ToastContainer />
      </>
    )

    const promptItem = screen.getByText('Second Prompt').closest('[title="Double-click to rename"]')
    expect(promptItem).not.toBeNull()

    fireEvent.click(within(promptItem as HTMLElement).getByTitle('Delete'))
    fireEvent.click(within(promptItem as HTMLElement).getByTitle('Click again to confirm'))

    expect(screen.queryByText('Second Prompt')).toBeNull()
    expect(screen.getByText('Deleted "Second Prompt"')).toBeTruthy()
  })
})
