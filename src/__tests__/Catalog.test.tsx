import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { emptyGameInput, type Game } from '../types/game'

/* The data layer is mocked, which also keeps Supabase — and its demand for real
   project credentials — out of the unit test environment. */
const listPublishedGames = vi.fn()
vi.mock('../data/games', () => ({ listPublishedGames: () => listPublishedGames() }))

const { default: Catalog } = await import('../pages/Catalog')

const game = (id: string, name: string, categories: string[]): Game => ({
  ...emptyGameInput,
  id,
  name,
  shortDescription: `${name} summary.`,
  categories,
  launchUrl: 'https://example.com/game',
  published: true,
  createdAt: null,
  updatedAt: null,
})

const renderCatalog = () =>
  render(
    <MemoryRouter>
      <Catalog />
    </MemoryRouter>,
  )

beforeEach(() => {
  listPublishedGames.mockReset()
})

describe('Catalog page', () => {
  it('lists the published games once loaded', async () => {
    listPublishedGames.mockResolvedValue([
      game('beer-game', 'Beer Game', ['Simulation']),
      game('selly', 'Selly', ['Multiplayer']),
    ])
    renderCatalog()

    expect(await screen.findByRole('heading', { name: 'Beer Game' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Selly' })).toBeInTheDocument()
    expect(screen.getByText('2 games')).toBeInTheDocument()
  })

  it('filters by category without repainting the others away permanently', async () => {
    const user = userEvent.setup()
    listPublishedGames.mockResolvedValue([
      game('beer-game', 'Beer Game', ['Simulation']),
      game('selly', 'Selly', ['Multiplayer']),
    ])
    renderCatalog()
    await screen.findByRole('heading', { name: 'Beer Game' })

    await user.click(screen.getByRole('button', { name: 'Multiplayer' }))
    expect(screen.queryByRole('heading', { name: 'Beer Game' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Selly' })).toBeInTheDocument()
    expect(screen.getByText('1 game in Multiplayer')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByRole('heading', { name: 'Beer Game' })).toBeInTheDocument()
  })

  it('explains an empty catalog rather than showing a blank grid', async () => {
    listPublishedGames.mockResolvedValue([])
    renderCatalog()
    expect(await screen.findByText('The catalog is empty')).toBeInTheDocument()
  })

  it('offers a retry when the catalog cannot be loaded', async () => {
    listPublishedGames.mockRejectedValueOnce(new Error('permission-denied'))
    listPublishedGames.mockResolvedValueOnce([game('selly', 'Selly', [])])
    renderCatalog()

    const retry = await screen.findByRole('button', { name: /try again/i })
    await userEvent.click(retry)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Selly' })).toBeInTheDocument())
  })
})
