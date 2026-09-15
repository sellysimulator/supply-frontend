import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../theme/ThemeProvider'
import { THEME_STORAGE_KEY } from '../theme/context'
import { ThemeToggle } from '../components/layout/ThemeToggle'

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )

afterEach(() => {
  window.localStorage.removeItem(THEME_STORAGE_KEY)
  document.documentElement.classList.remove('dark')
})

describe('Theme', () => {
  it('follows the system preference until the reader chooses', () => {
    renderToggle()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('marks the document when dark is chosen, and remembers the choice', async () => {
    renderToggle()

    await userEvent.click(screen.getByRole('button', { name: /dark theme/i }))

    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('names the theme it would switch to, not the one in use', async () => {
    renderToggle()

    const toggle = screen.getByRole('button', { name: /dark theme/i })
    await userEvent.click(toggle)

    expect(screen.getByRole('button', { name: /light theme/i })).toBeInTheDocument()
  })

  it('restores a remembered choice on the next visit', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderToggle()
    expect(document.documentElement).toHaveClass('dark')
  })
})
