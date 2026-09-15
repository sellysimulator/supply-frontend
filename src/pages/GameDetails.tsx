import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'
import {
  Badge,
  ButtonExternal,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingSection,
} from '../components/ui'
import { PageContainer } from '../components/layout/Layout'
import { GameMeta } from '../components/catalog/GameMeta'
import { GameThumbnail } from '../components/catalog/GameThumbnail'
import { ScreenshotGallery } from '../components/catalog/ScreenshotGallery'
import { getGame } from '../data/games'
import { recordGameClick } from '../data/analytics'
import { useAsync } from '../hooks/useAsync'

export default function GameDetails() {
  const { t } = useTranslation()
  const { gameId = '' } = useParams<{ gameId: string }>()
  const { data: game, loading, error } = useAsync(() => getGame(gameId), [gameId])

  if (loading) {
    return (
      <PageContainer>
        <LoadingSection label={t('details.loading')} />
      </PageContainer>
    )
  }

  if (error || !game || !game.published) {
    return (
      <PageContainer>
        <ErrorState
          title={t('details.notFoundTitle')}
          description={t('details.notFoundDescription')}
          action={
            <ButtonLink to="/catalog" variant="secondary">
              {t('details.back')}
            </ButtonLink>
          }
        />
      </PageContainer>
    )
  }

  /* The click is recorded as the visitor leaves for the game. It is anonymous
     and best-effort: the navigation must happen whether or not it succeeds. */
  const onLaunch = () => {
    void recordGameClick(game.id)
  }

  return (
    <PageContainer>
      <Link
        to="/catalog"
        className="mb-6 inline-flex h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t('details.back')}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="flex flex-col gap-4">
            {game.categories.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {game.categories.map((category) => (
                  <li key={category}>
                    <Badge tone="primary">{category}</Badge>
                  </li>
                ))}
              </ul>
            )}

            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{game.name}</h1>
            <p className="text-lg text-muted-foreground">{game.shortDescription}</p>
            <GameMeta game={game} />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">{t('details.about')}</h2>
            <div className="flex flex-col gap-3 leading-relaxed text-muted-foreground">
              {game.fullDescription.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {game.learningObjectives.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">{t('details.objectives')}</h2>
              <ul className="flex flex-col gap-2">
                {game.learningObjectives.map((objective) => (
                  <li
                    key={objective}
                    className="flex gap-3 border-l-2 border-primary pl-3 text-muted-foreground"
                  >
                    {objective}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {game.screenshots.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">{t('details.screenshots')}</h2>
              <ScreenshotGallery screenshots={game.screenshots} gameName={game.name} />
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="overflow-hidden">
            <GameThumbnail game={game} />
            <CardBody className="flex flex-col gap-3">
              <ButtonExternal href={game.launchUrl} onClick={onLaunch} size="lg" className="w-full">
                {t('details.launch')}
                <ExternalLink size={16} aria-hidden="true" />
              </ButtonExternal>
              <p className="text-xs text-muted-foreground">{t('details.launchNote')}</p>
            </CardBody>
          </Card>

          {game.resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('details.resources')}</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="flex flex-col gap-2">
                  {game.resources.map((resource) => (
                    <li key={resource.url}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary transition-colors duration-200 hover:text-primary-hover"
                      >
                        <FileText size={15} aria-hidden="true" className="shrink-0" />
                        {resource.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {game.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('details.tags')}</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="flex flex-wrap gap-1.5">
                  {game.tags.map((tag) => (
                    <li key={tag}>
                      <Badge tone="muted">{tag}</Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </aside>
      </div>
    </PageContainer>
  )
}
