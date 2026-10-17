import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { emptyGameInput, type Game } from '../types/game'

const listAllGames = vi.fn()
const deleteGame = vi.fn()
const setGamePublished = vi.fn()
const setFeaturedGame = vi.fn()

vi.mock('../data/games', () => ({
  listAllGames: () => listAllGames(),
  deleteGame: (game: Game) => deleteGame(game),
  setGamePublished: (id: string, published: boolean) => setGamePublished(id, published),
  setFeaturedGame: (id: string | null) => setFeaturedGame(id),
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
  featured: false,
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
  setFeaturedGame.mockReset().mockResolvedValue(undefined)
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

describe('GamesList featured game', () => {
  const beer: Game = { ...game, name: 'Beer Game' }

  it('features a published game', async () => {
    const user = userEvent.setup()
    listAllGames.mockResolvedValue([beer])
    renderGamesList()

    await user.click(await screen.findByRole('button', { name: 'Feature Beer Game' }))
    expect(setFeaturedGame).toHaveBeenCalledWith('beer-game')
  })

  it('clears the choice when the featured game is toggled again', async () => {
    const user = userEvent.setup()
    listAllGames.mockResolvedValue([{ ...beer, featured: true }])
    renderGamesList()

    const toggle = await screen.findByRole('button', { name: 'Stop featuring Beer Game' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Featured')).toBeInTheDocument()

    await user.click(toggle)
    expect(setFeaturedGame).toHaveBeenCalledWith(null)
  })

  it('does not offer to feature a draft', async () => {
    listAllGames.mockResolvedValue([{ ...beer, published: false }])
    renderGamesList()

    expect(
      await screen.findByRole('button', {
        name: 'Beer Game is a draft. Publish it before featuring it.',
      }),
    ).toBeDisabled()
  })

  it('reports a failed change instead of failing silently', async () => {
    const user = userEvent.setup()
    setFeaturedGame.mockRejectedValue(new Error('only a published game can be featured'))
    listAllGames.mockResolvedValue([beer])
    renderGamesList()

    await user.click(await screen.findByRole('button', { name: 'Feature Beer Game' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not feature Beer Game.')
  })
})
