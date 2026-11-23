import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { emptyGameInput, type Game, type GameInput } from '../types/game'

const getGame = vi.fn()
const gameIdExists = vi.fn()
const createGame = vi.fn()
const updateGame = vi.fn()

vi.mock('../data/games', () => ({
  getGame: (id: string) => getGame(id),
  gameIdExists: (id: string) => gameIdExists(id),
  createGame: (id: string, input: GameInput) => createGame(id, input),
  updateGame: (id: string, input: GameInput) => updateGame(id, input),
}))

const { default: GameForm } = await import('../pages/admin/GameForm')

const game: Game = {
  ...emptyGameInput,
  id: 'beer-game',
  name: 'Beer Game',
  shortDescription: 'The classic supply chain simulation.',
  fullDescription: 'A long enough description of the classic game.',
  launchUrl: 'https://example.com/beer-game',
  published: true,
  featured: false,
  createdAt: null,
  updatedAt: null,
}

const renderForm = (path = '/admin/games/beer-game') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/games" element={<p>Games list</p>} />
        <Route path="/admin/games/new" element={<GameForm />} />
        <Route path="/admin/games/:gameId" element={<GameForm />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  getGame.mockReset().mockResolvedValue(game)
  gameIdExists.mockReset().mockResolvedValue(false)
  createGame.mockReset().mockResolvedValue(undefined)
  updateGame.mockReset().mockResolvedValue(undefined)
})

describe('GameForm loading', () => {
  it('reports a failed load with a retry instead of "not found"', async () => {
    getGame.mockRejectedValueOnce(new Error('Failed to fetch'))
    renderForm()

    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument()
    expect(screen.queryByText('Game not found')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByDisplayValue('Beer Game')).toBeInTheDocument()
  })

  it('says "not found" when the entry does not exist', async () => {
    getGame.mockResolvedValue(null)
    renderForm()
    expect(await screen.findByText('Game not found')).toBeInTheDocument()
  })
})
