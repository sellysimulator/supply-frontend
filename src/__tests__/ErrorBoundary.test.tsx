import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../components/layout/ErrorBoundary'

function Boom(): never {
  throw new Error('render failed')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders its children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>Catalog</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Catalog')).toBeInTheDocument()
  })

  it('replaces a crashed tree with an error and a reload button instead of a blank page', () => {
    // React reports the caught error to the console; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/this page stopped working/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
  })
})
