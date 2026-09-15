import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  LoadingSection,
  Modal,
  Table,
  Td,
  Th,
} from '../../components/ui'
import { deleteGame, listAllGames, setGamePublished } from '../../data/games'
import type { Game } from '../../types/game'
import { useAsync } from '../../hooks/useAsync'

export default function GamesList() {
  const { data: games, loading, error, reload } = useAsync(() => listAllGames(), [])
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Game | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const togglePublished = async (game: Game) => {
    setPendingId(game.id)
    setActionError(null)
    try {
      await setGamePublished(game.id, !game.published)
      reload()
    } catch {
      setActionError(`Could not ${game.published ? 'unpublish' : 'publish'} ${game.name}.`)
    } finally {
      setPendingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setPendingId(toDelete.id)
    setActionError(null)
    try {
      await deleteGame(toDelete)
      setToDelete(null)
      reload()
    } catch {
      setActionError(`Could not delete ${toDelete.name}.`)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">Games</h2>
          <p className="text-sm text-muted-foreground">
            Catalog entries. Only published games are visible to visitors.
          </p>
        </div>
        <ButtonLink to="/admin/games/new" className="w-fit">
          <Plus size={16} aria-hidden="true" />
          Add game
        </ButtonLink>
      </div>

      {actionError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {actionError}
        </p>
      )}

      {loading && <LoadingSection label="Loading games" />}

      {error && (
        <ErrorState
          description="The catalog could not be loaded."
          action={
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          }
        />
      )}

      {games && !loading && !error && games.length === 0 && (
        <EmptyState
          title="No games yet"
          description="Add the first catalog entry to get started."
          action={<ButtonLink to="/admin/games/new">Add game</ButtonLink>}
        />
      )}

      {games && games.length > 0 && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Game</Th>
                <Th className="hidden sm:table-cell">Identifier</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id}>
                  <Td>
                    <span className="font-medium text-foreground">{game.name}</span>
                    <span className="block max-w-sm truncate text-xs text-muted-foreground">
                      {game.shortDescription}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <code className="text-xs text-muted-foreground">{game.id}</code>
                  </Td>
                  <Td>
                    {game.published ? (
                      <Badge tone="success">Published</Badge>
                    ) : (
                      <Badge tone="muted">Draft</Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void togglePublished(game)}
                        disabled={pendingId === game.id}
                        title={game.published ? 'Unpublish' : 'Publish'}
                      >
                        {game.published ? (
                          <EyeOff size={15} aria-hidden="true" />
                        ) : (
                          <Eye size={15} aria-hidden="true" />
                        )}
                        <span className="sr-only">
                          {game.published ? `Unpublish ${game.name}` : `Publish ${game.name}`}
                        </span>
                      </Button>

                      <Link
                        to={`/admin/games/${game.id}`}
                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                      >
                        <Pencil size={15} aria-hidden="true" />
                        <span className="sr-only">Edit {game.name}</span>
                      </Link>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setToDelete(game)}
                        disabled={pendingId === game.id}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        <span className="sr-only">Delete {game.name}</span>
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Delete this game?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={pendingId !== null}
            >
              {pendingId ? 'Deleting…' : 'Delete game'}
            </Button>
          </>
        }
      >
        <p>
          <span className="font-medium text-foreground">{toDelete?.name}</span> will be removed from
          the catalog along with its uploaded images. This cannot be undone.
        </p>
        <p className="mt-3">
          Recorded launch counts are kept, so historical analytics stay intact.
        </p>
      </Modal>
    </div>
  )
}
