import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  LoadingSection,
  Modal,
  SectionHeader,
  Table,
  Td,
  Th,
} from '../../components/ui'
import { deleteGame, listAllGames, setFeaturedGame, setGamePublished } from '../../data/games'
import type { Game } from '../../types/game'
import { useAsync } from '../../hooks/useAsync'

export default function GamesList() {
  const { t } = useTranslation()
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
      setActionError(
        t(game.published ? 'admin.gamesList.unpublishFailed' : 'admin.gamesList.publishFailed', {
          name: game.name,
        }),
      )
    } finally {
      setPendingId(null)
    }
  }

  /* Featuring a game replaces whichever one was featured before; featuring the
     current one again clears the choice. */
  const toggleFeatured = async (game: Game) => {
    setPendingId(game.id)
    setActionError(null)
    try {
      await setFeaturedGame(game.featured ? null : game.id)
      reload()
    } catch {
      setActionError(
        t(game.featured ? 'admin.gamesList.unfeatureFailed' : 'admin.gamesList.featureFailed', {
          name: game.name,
        }),
      )
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
      setActionError(t('admin.gamesList.deleteFailed', { name: toDelete.name }))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <SectionHeader
          level={2}
          title={t('admin.gamesList.title')}
          description={t('admin.gamesList.description')}
          actions={
            <ButtonLink to="/admin/games/new">
              <Plus size={16} aria-hidden="true" />
              {t('admin.gamesList.add')}
            </ButtonLink>
          }
        />
      </Card>

      {actionError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {actionError}
        </p>
      )}

      {loading && <LoadingSection label={t('admin.gamesList.loading')} />}

      {error && (
        <ErrorState
          description={t('admin.gamesList.loadError')}
          action={
            <Button variant="secondary" onClick={reload}>
              {t('common.tryAgain')}
            </Button>
          }
        />
      )}

      {games && !loading && !error && games.length === 0 && (
        <EmptyState
          title={t('admin.gamesList.emptyTitle')}
          description={t('admin.gamesList.emptyDescription')}
          action={<ButtonLink to="/admin/games/new">{t('admin.gamesList.add')}</ButtonLink>}
        />
      )}

      {games && games.length > 0 && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>{t('admin.gamesList.columnGame')}</Th>
                <Th className="hidden sm:table-cell">{t('admin.gamesList.columnIdentifier')}</Th>
                <Th>{t('admin.gamesList.columnStatus')}</Th>
                <Th className="text-right">{t('admin.gamesList.columnActions')}</Th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="transition-colors duration-200 hover:bg-surface">
                  <Td>
                    <span className="font-medium text-foreground">{game.name}</span>
                    <span className="block max-w-sm truncate text-xs text-muted-foreground">
                      {game.shortDescription}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <code className="rounded-xs bg-muted px-1 py-0.5 text-xs text-muted-foreground">
                      {game.id}
                    </code>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {game.published ? (
                        <Badge tone="success">{t('admin.gamesList.published')}</Badge>
                      ) : (
                        <Badge tone="muted">{t('admin.gamesList.draft')}</Badge>
                      )}
                      {game.featured && (
                        <Badge tone="primary">{t('admin.gamesList.featured')}</Badge>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void toggleFeatured(game)}
                        disabled={pendingId === game.id || !game.published}
                        aria-pressed={game.featured}
                        title={t(
                          game.featured
                            ? 'admin.gamesList.unfeature'
                            : game.published
                              ? 'admin.gamesList.feature'
                              : 'admin.gamesList.featureDraft',
                        )}
                      >
                        <Star
                          size={15}
                          aria-hidden="true"
                          fill={game.featured ? 'currentColor' : 'none'}
                        />
                        <span className="sr-only">
                          {t(
                            game.featured
                              ? 'admin.gamesList.unfeatureGame'
                              : game.published
                                ? 'admin.gamesList.featureGame'
                                : 'admin.gamesList.featureDraftGame',
                            { name: game.name },
                          )}
                        </span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void togglePublished(game)}
                        disabled={pendingId === game.id}
                        title={t(
                          game.published ? 'admin.gamesList.unpublish' : 'admin.gamesList.publish',
                        )}
                      >
                        {game.published ? (
                          <EyeOff size={15} aria-hidden="true" />
                        ) : (
                          <Eye size={15} aria-hidden="true" />
                        )}
                        <span className="sr-only">
                          {t(
                            game.published
                              ? 'admin.gamesList.unpublishGame'
                              : 'admin.gamesList.publishGame',
                            { name: game.name },
                          )}
                        </span>
                      </Button>

                      <Link
                        to={`/admin/games/${game.id}`}
                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                      >
                        <Pencil size={15} aria-hidden="true" />
                        <span className="sr-only">
                          {t('admin.gamesList.editGame', { name: game.name })}
                        </span>
                      </Link>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setToDelete(game)}
                        disabled={pendingId === game.id}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        <span className="sr-only">
                          {t('admin.gamesList.deleteGame', { name: game.name })}
                        </span>
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
        title={t('admin.gamesList.deleteTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={pendingId !== null}
            >
              {pendingId ? t('admin.gamesList.deleting') : t('admin.gamesList.confirmDelete')}
            </Button>
          </>
        }
      >
        <p>
          <Trans
            i18nKey="admin.gamesList.deleteBody"
            values={{ name: toDelete?.name ?? '' }}
            components={[<span key="name" className="font-medium text-foreground" />]}
          />
        </p>
        <p className="mt-3">{t('admin.gamesList.deleteNote')}</p>
      </Modal>
    </div>
  )
}
