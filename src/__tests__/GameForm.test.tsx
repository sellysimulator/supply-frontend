import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { emptyGameInput, type Game, type GameInput, type StoredImage } from '../types/game'

const getGame = vi.fn()
const gameIdExists = vi.fn()
const createGame = vi.fn()
const updateGame = vi.fn()
const uploadCatalogImage = vi.fn()
const deleteCatalogImages = vi.fn()

vi.mock('../data/games', () => ({
  getGame: (id: string) => getGame(id),
  gameIdExists: (id: string) => gameIdExists(id),
  createGame: (id: string, input: GameInput) => createGame(id, input),
  updateGame: (id: string, input: GameInput) => updateGame(id, input),
}))

vi.mock('../data/images', () => ({
  uploadCatalogImage: (id: string, file: File) => uploadCatalogImage(id, file),
  deleteCatalogImages: (images: StoredImage[]) => deleteCatalogImages(images),
}))

const { default: GameForm } = await import('../pages/admin/GameForm')

const image = (name: string): StoredImage => ({
  path: `games/beer-game/${name}`,
  url: `https://cdn.test/${name}`,
})
const thumbnail = image('thumb.png')
const shotA = image('a.png')
const shotB = image('b.png')

const game: Game = {
  ...emptyGameInput,
  id: 'beer-game',
  name: 'Beer Game',
  shortDescription: 'The classic supply chain simulation.',
  fullDescription: 'A long enough description of the classic game.',
  launchUrl: 'https://example.com/beer-game',
  thumbnail,
  screenshots: [shotA, shotB],
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
  uploadCatalogImage.mockReset()
  deleteCatalogImages.mockReset().mockResolvedValue(undefined)
})

/* The thumbnail's remove button comes first, then one per screenshot. */
const removeButtons = () => screen.getAllByRole('button', { name: 'Remove image' })
const saveButton = () => screen.getAllByRole('button', { name: 'Save changes' })[0]!

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

describe('GameForm images', () => {
  it('keeps a removed image in storage when the edit is cancelled', async () => {
    const user = userEvent.setup()
    renderForm()
    await screen.findByDisplayValue('Beer Game')

    await user.click(removeButtons()[1]!)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByText('Games list')).toBeInTheDocument()
    expect(deleteCatalogImages).not.toHaveBeenCalled()
  })

  it('deletes a removed image only after the save succeeds', async () => {
    const user = userEvent.setup()
    renderForm()
    await screen.findByDisplayValue('Beer Game')

    await user.click(removeButtons()[1]!)
    expect(deleteCatalogImages).not.toHaveBeenCalled()

    await user.click(saveButton())
    await screen.findByText('Games list')

    expect(updateGame).toHaveBeenCalledWith(
      'beer-game',
      expect.objectContaining({ thumbnail, screenshots: [shotB] }),
    )
    expect(deleteCatalogImages).toHaveBeenCalledWith([shotA])
    expect(updateGame.mock.invocationCallOrder[0]!).toBeLessThan(
      deleteCatalogImages.mock.invocationCallOrder[0]!,
    )
  })

  it('deletes nothing when the save fails', async () => {
    updateGame.mockRejectedValue(new Error('Failed to fetch'))
    const user = userEvent.setup()
    renderForm()
    await screen.findByDisplayValue('Beer Game')

    await user.click(removeButtons()[1]!)
    await user.click(saveButton())

    expect(await screen.findByText(/saving failed/i)).toBeInTheDocument()
    expect(deleteCatalogImages).not.toHaveBeenCalled()
  })

  it('deletes the old thumbnail after saving a replacement', async () => {
    const replacement = image('new-thumb.png')
    uploadCatalogImage.mockResolvedValue(replacement)
    const user = userEvent.setup()
    const { container } = renderForm()
    await screen.findByDisplayValue('Beer Game')

    const input = container.querySelector<HTMLInputElement>('#upload-thumbnail')!
    await user.upload(input, new File(['x'], 'new-thumb.png', { type: 'image/png' }))
    await user.click(saveButton())
    await screen.findByText('Games list')

    expect(updateGame).toHaveBeenCalledWith(
      'beer-game',
      expect.objectContaining({ thumbnail: replacement }),
    )
    expect(deleteCatalogImages).toHaveBeenCalledWith([thumbnail])
  })

  it('also deletes an image uploaded and then removed before saving', async () => {
    const extra = image('extra.png')
    uploadCatalogImage.mockResolvedValue(extra)
    const user = userEvent.setup()
    const { container } = renderForm()
    await screen.findByDisplayValue('Beer Game')

    const input = container.querySelector<HTMLInputElement>('#upload-screenshots')!
    await user.upload(input, new File(['x'], 'extra.png', { type: 'image/png' }))
    await user.click(removeButtons()[3]!)
    await user.click(saveButton())
    await screen.findByText('Games list')

    expect(updateGame).toHaveBeenCalledWith(
      'beer-game',
      expect.objectContaining({ screenshots: [shotA, shotB] }),
    )
    expect(deleteCatalogImages).toHaveBeenCalledWith([extra])
  })
})

describe('GameForm validation and save feedback', () => {
  it('shows the audience length error instead of failing silently', async () => {
    const user = userEvent.setup()
    renderForm()
    const audience = await screen.findByLabelText('Intended audience')

    await user.clear(audience)
    await user.click(audience)
    await user.paste('x'.repeat(161))
    await user.click(saveButton())

    expect(await screen.findByText('Keep the audience under 160 characters')).toBeInTheDocument()
    expect(updateGame).not.toHaveBeenCalled()
  })

  it('shows an error for a cleared sort order', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.clear(await screen.findByLabelText('Sort order'))
    await user.click(saveButton())

    expect(await screen.findByText('Enter a whole number')).toBeInTheDocument()
    expect(updateGame).not.toHaveBeenCalled()
  })

  it('reports a failed identifier check instead of doing nothing', async () => {
    gameIdExists.mockRejectedValue(new Error('Failed to fetch'))
    const user = userEvent.setup()
    renderForm('/admin/games/new')

    await user.type(screen.getByLabelText(/^Name/), 'Beer Game')
    await user.type(
      screen.getByLabelText(/^Catalog summary/),
      'The classic supply chain simulation.',
    )
    await user.type(
      screen.getByLabelText(/^Full description/),
      'A long enough description of the classic game.',
    )
    await user.type(screen.getByLabelText(/^Launch URL/), 'https://example.com/beer-game')
    await user.click(screen.getAllByRole('button', { name: 'Create game' })[0]!)

    expect(await screen.findByText(/saving failed/i)).toBeInTheDocument()
    expect(gameIdExists).toHaveBeenCalledWith('beer-game')
    expect(createGame).not.toHaveBeenCalled()
  })

  it('still reports a taken identifier', async () => {
    gameIdExists.mockResolvedValue(true)
    const user = userEvent.setup()
    renderForm('/admin/games/new')

    await user.type(screen.getByLabelText(/^Name/), 'Beer Game')
    await user.type(
      screen.getByLabelText(/^Catalog summary/),
      'The classic supply chain simulation.',
    )
    await user.type(
      screen.getByLabelText(/^Full description/),
      'A long enough description of the classic game.',
    )
    await user.type(screen.getByLabelText(/^Launch URL/), 'https://example.com/beer-game')
    await user.click(screen.getAllByRole('button', { name: 'Create game' })[0]!)

    expect(
      await screen.findByText('A game with this identifier already exists'),
    ).toBeInTheDocument()
    expect(createGame).not.toHaveBeenCalled()
  })
})
