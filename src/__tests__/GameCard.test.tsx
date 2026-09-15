import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GameCard } from '../components/catalog/GameCard'
import { emptyGameInput, type Game } from '../types/game'

const game: Game = {
  ...emptyGameInput,
  id: 'beer-game',
  name: 'Beer Game',
  shortDescription: 'The classic supply chain simulation.',
  minPlayers: 4,
  maxPlayers: 4,
  durationMinutes: 90,
  categories: ['Simulation'],
  launchUrl: 'https://example.com/beer-game',
  published: true,
  createdAt: null,
  updatedAt: null,
}

const renderCard = (entry: Game = game) =>
  render(
    <MemoryRouter>
      <GameCard game={entry} />
    </MemoryRouter>,
  )

describe('GameCard', () => {
  it('shows the name, summary and category', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Beer Game' })).toBeInTheDocument()
    expect(screen.getByText('The classic supply chain simulation.')).toBeInTheDocument()
    expect(screen.getByText('Simulation')).toBeInTheDocument()
  })

  it('summarises the session in a scannable form', () => {
    renderCard()
    expect(screen.getByText('4 players')).toBeInTheDocument()
    expect(screen.getByText('1 h 30 min')).toBeInTheDocument()
  })

  it('links to the details page rather than straight to the game', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /more details/i })
    expect(link).toHaveAttribute('href', '/games/beer-game')
  })

  it('names the game in the link for screen reader users', () => {
    renderCard()
    expect(screen.getByRole('link', { name: /more details about beer game/i })).toBeInTheDocument()
  })

  it('renders a placeholder when the entry has no thumbnail', () => {
    renderCard()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders the thumbnail with descriptive alternative text', () => {
    renderCard({
      ...game,
      thumbnail: { path: 'games/beer-game/thumb.png', url: 'https://cdn.test/thumb.png' },
    })
    expect(screen.getByRole('img', { name: 'Beer Game thumbnail' })).toBeInTheDocument()
  })
})
