import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { Header } from '../src/components/Header'
import { ToastContainer } from '../src/components/Toast'
import { content } from '../src/state/editor'

describe('Header copy button', () => {
  it('shows a toast after copying markdown', async () => {
    content.value = '# Heading\n\nParagraph with **bold** text'

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    })

    render(
      <>
        <Header />
        <ToastContainer />
      </>
    )

    fireEvent.click(screen.getByTitle('Copy as Markdown'))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('# Heading\n\nParagraph with **bold** text')
      expect(screen.getByText('Copied to clipboard')).toBeTruthy()
    })
  })
})
