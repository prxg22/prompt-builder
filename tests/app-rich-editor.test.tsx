import { fireEvent, render, screen } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/app'
import { content, viewMode } from '../src/state/editor'

vi.mock('../src/components/Editor', () => ({
  Editor: () => <div data-testid="source-editor">Source editor</div>,
}))

describe('App rich editor layout', () => {
  beforeEach(() => {
    viewMode.value = 'split'
    content.value = '# Heading'
  })

  it('cycles through split, editor-only, and preview-only views', async () => {
    render(<App />)

    // Split view: both editor and preview visible
    expect(screen.getByTestId('source-editor')).toBeTruthy()
    expect(screen.getByRole('toolbar', { name: 'Markdown formatting' })).toBeTruthy()
    expect(document.querySelector('.preview-editable')).not.toBeNull()

    // Click cycles split → editor
    fireEvent.click(screen.getByTitle('Split view'))
    expect(screen.getByTestId('source-editor')).toBeTruthy()
    expect(document.querySelector('.preview-editable')).toBeNull()

    // Click cycles editor → preview
    fireEvent.click(screen.getByTitle('Code editor'))
    expect(screen.queryByTestId('source-editor')).toBeNull()
    expect(await screen.findByRole('toolbar', { name: 'Markdown formatting' })).toBeTruthy()
    expect(document.querySelector('.preview-editable')).not.toBeNull()

    // Click cycles preview → split
    fireEvent.click(screen.getByTitle('Markdown preview'))
    expect(screen.getByTestId('source-editor')).toBeTruthy()
    expect(screen.getByRole('toolbar', { name: 'Markdown formatting' })).toBeTruthy()
  })
})
