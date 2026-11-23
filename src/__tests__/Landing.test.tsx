import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { emptyGameInput, type Game } from '../types/game'

const listPublishedGames = vi.fn()
vi.mock('../data/games', () => ({ listPublishedGames: () => listPublishedGames() }))

const { default: Landing } = await import('../pages/Landing')

const game: Game = {
  ...emptyGameInput,
  id: 'beer-game',
  name: 'Beer Game',
  shortDescription: 'The classic supply chain simulation.',
  launchUrl: 'https://example.com/beer-game',
  published: true,
  featured: false,
  createdAt: null,
  updatedAt: null,
}

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  )

beforeEach(() => {
  listPublishedGames.mockReset()
})

describe('Landing page', () => {
  it('lists the published games', async () => {
    listPublishedGames.mockResolvedValue([game])
    renderLanding()
    expect(await screen.findByRole('heading', { name: 'Beer Game' })).toBeInTheDocument()
  })

  it('reports a failed load with a retry instead of claiming the catalog is empty', async () => {
    listPublishedGames
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce([game])
    renderLanding()

    expect(await screen.findByText(/the games could not be loaded/i)).toBeInTheDocument()
    expect(screen.queryByText(/no games have been published yet/i)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Beer Game' })).toBeInTheDocument()
  })
})
