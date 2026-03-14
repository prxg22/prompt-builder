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

  it('keeps the source editor available in split view and keeps the rich preview editable in both layouts', async () => {
    render(<App />)

    expect(screen.getByTestId('source-editor')).toBeTruthy()
    expect(screen.getByRole('toolbar', { name: 'Markdown formatting' })).toBeTruthy()
    expect(document.querySelector('.preview-editable')).not.toBeNull()

    fireEvent.click(screen.getByTitle('Preview only'))

    expect(screen.queryByTestId('source-editor')).toBeNull()
    expect(await screen.findByRole('toolbar', { name: 'Markdown formatting' })).toBeTruthy()
    expect(document.querySelector('.preview-editable')).not.toBeNull()

    fireEvent.click(screen.getByTitle('Split view'))

    expect(screen.getByTestId('source-editor')).toBeTruthy()
    expect(screen.getByRole('toolbar', { name: 'Markdown formatting' })).toBeTruthy()
  })
})
