import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { emptyGameInput, type Game } from '../types/game'

const getGame = vi.fn()
const recordGameClick = vi.fn()

vi.mock('../data/games', () => ({ getGame: (id: string) => getGame(id) }))
vi.mock('../data/analytics', () => ({
  recordGameClick: (id: string) => recordGameClick(id),
}))

const { default: GameDetails } = await import('../pages/GameDetails')

const game: Game = {
  ...emptyGameInput,
  id: 'selly',
  name: 'Tequila Game',
  shortDescription: 'A real-time supply chain simulator.',
  fullDescription: 'First paragraph.\n\nSecond paragraph.',
  learningObjectives: ['Experience the bullwhip effect'],
  minPlayers: 2,
  maxPlayers: 8,
  durationMinutes: 60,
  categories: ['Simulation'],
  launchUrl: 'https://sellysim.web.app',
  published: true,
  createdAt: null,
  updatedAt: null,
}

const renderDetails = () =>
  render(
    <MemoryRouter initialEntries={['/games/selly']}>
      <Routes>
        <Route path="/games/:gameId" element={<GameDetails />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  getGame.mockReset()
  recordGameClick.mockReset()
  recordGameClick.mockResolvedValue(undefined)
})

describe('Game details page', () => {
  it('shows the catalog information for the game', async () => {
    getGame.mockResolvedValue(game)
    renderDetails()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tequila Game' }),
    ).toBeInTheDocument()
    expect(screen.getByText('First paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Experience the bullwhip effect')).toBeInTheDocument()
    expect(screen.getByText('2–8 players')).toBeInTheDocument()
  })

  it('links out to the game, opening it safely in a new tab', async () => {
    getGame.mockResolvedValue(game)
    renderDetails()

    const launch = await screen.findByRole('link', { name: /launch game/i })
    expect(launch).toHaveAttribute('href', 'https://sellysim.web.app')
    expect(launch).toHaveAttribute('target', '_blank')
    expect(launch).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('records exactly one anonymous click when the game is launched', async () => {
    getGame.mockResolvedValue(game)
    renderDetails()

    await userEvent.click(await screen.findByRole('link', { name: /launch game/i }))
    expect(recordGameClick).toHaveBeenCalledTimes(1)
    expect(recordGameClick).toHaveBeenCalledWith('selly')
  })

  it('does not record a click merely for viewing the page', async () => {
    getGame.mockResolvedValue(game)
    renderDetails()
    await screen.findByRole('heading', { level: 1, name: 'Tequila Game' })
    expect(recordGameClick).not.toHaveBeenCalled()
  })

  it('treats an unpublished game as not found', async () => {
    getGame.mockResolvedValue({ ...game, published: false })
    renderDetails()
    expect(await screen.findByText('Game not found')).toBeInTheDocument()
  })

  it('treats a missing game as not found', async () => {
    getGame.mockResolvedValue(null)
    renderDetails()
    expect(await screen.findByText('Game not found')).toBeInTheDocument()
  })
})
