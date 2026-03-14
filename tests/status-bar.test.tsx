import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { StatusBar } from '../src/components/StatusBar'

describe('StatusBar', () => {
  it('shows markdown instructions behind an info tooltip icon', () => {
    render(<StatusBar />)

    const help = screen.getByLabelText('Markdown shortcuts')
    expect(help.getAttribute('title')).toContain('# Title')
  })
})
