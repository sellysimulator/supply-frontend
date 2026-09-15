import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TermsModal } from '../components/TermsModal'

describe('Terms and Conditions', () => {
  const open = () => {
    const onClose = vi.fn()
    render(<TermsModal open onClose={onClose} />)
    return onClose
  }

  it('is a labelled dialog', () => {
    open()
    expect(screen.getByRole('dialog', { name: 'Terms and Conditions' })).toBeInTheDocument()
  })

  it('discloses that anonymous interaction data is collected for trend analysis', () => {
    open()
    expect(
      screen.getByText(/anonymous data about interactions with the games/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/trend analysis/i)).toBeInTheDocument()
  })

  it('states which facts are recorded', () => {
    open()
    expect(screen.getByText(/which game was selected and the hour/i)).toBeInTheDocument()
  })

  it('states what is not recorded', () => {
    open()
    expect(
      screen.getByText(/do not contain your name, email address, account identifier/i),
    ).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const onClose = open()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes from the close button', async () => {
    const onClose = open()
    await userEvent.click(screen.getByRole('button', { name: /close dialog/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    render(<TermsModal open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
