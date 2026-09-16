import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { emptyGameInput, type Game } from '../types/game'

const listAllGames = vi.fn()
const deleteGame = vi.fn()
const setGamePublished = vi.fn()

vi.mock('../data/games', () => ({
  listAllGames: () => listAllGames(),
  deleteGame: (game: Game) => deleteGame(game),
  setGamePublished: (id: string, published: boolean) => setGamePublished(id, published),
}))

const { default: GamesList } = await import('../pages/admin/GamesList')

/* A game name is a database value an administrator can set — never something
   to trust as markup. If <Trans> ever parsed it instead of treating it as
   text, this string would inject a live <img> with an executing handler. */
const maliciousName = '<img src=x onerror="alert(1)">'

const game: Game = {
  ...emptyGameInput,
  id: 'beer-game',
  name: maliciousName,
  shortDescription: 'The classic supply chain simulation.',
  launchUrl: 'https://example.com/beer-game',
  published: true,
  createdAt: null,
  updatedAt: null,
}

const renderGamesList = () =>
  render(
    <MemoryRouter>
      <GamesList />
    </MemoryRouter>,
  )

beforeEach(() => {
  listAllGames.mockReset().mockResolvedValue([game])
  deleteGame.mockReset()
  setGamePublished.mockReset()
})

describe('GamesList delete confirmation', () => {
  it('renders an untrusted game name as literal text, not markup', async () => {
    const user = userEvent.setup()
    renderGamesList()

    const row = (await screen.findAllByRole('row')).find((candidate) =>
      candidate.textContent?.includes(maliciousName),
    )
    if (!row) throw new Error('expected the malicious game to appear in a table row')

    const rowButtons = within(row).getAllByRole('button')
    await user.click(rowButtons[rowButtons.length - 1]!)

    const dialog = await screen.findByRole('dialog', { name: 'Delete this game?' })

    // The dialog must not have parsed the name into an actual <img> element —
    // that would mean an administrator-entered value could inject markup.
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument()
    expect(dialog.querySelector('img')).toBeNull()
    expect(within(dialog).getByText(maliciousName)).toBeInTheDocument()
  })
})
