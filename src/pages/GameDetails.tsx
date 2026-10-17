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
  IconPad,
  LoadingSection,
  SectionHeader,
  Surface,
} from '../components/ui'
import { PageContainer } from '../components/layout/Layout'
import { BentoGrid, BentoItem } from '../components/layout/BentoGrid'
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
        className="mb-4 inline-flex h-11 items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t('details.back')}
      </Link>

      <BentoGrid>
        {/* ------------------------------------------------------ Main column */}
        <BentoItem span={8} reveal={false} className="sm:col-span-6">
          <div className="flex flex-col gap-4">
            <Card className="p-6 sm:p-8">
              {game.categories.length > 0 && (
                <ul className="mb-4 flex flex-wrap gap-1.5">
                  {game.categories.map((category) => (
                    <li key={category}>
                      <Badge tone="primary">{category}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
                {game.name}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {game.shortDescription}
              </p>
              <GameMeta game={game} className="mt-5" />
            </Card>

            <Card className="p-6 sm:p-8">
              <SectionHeader level={2} title={t('details.about')} />
              <div className="mt-4 flex flex-col gap-3 leading-relaxed text-muted-foreground">
                {game.fullDescription.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {game.learningObjectives.length > 0 && (
              <Card className="p-6 sm:p-8">
                <SectionHeader level={2} title={t('details.objectives')} />
                <ul className="mt-4 flex flex-col gap-2">
                  {game.learningObjectives.map((objective, index) => (
                    <li key={objective}>
                      <Surface className="flex items-start gap-3 p-3 text-muted-foreground">
                        <IconPad size="sm">{index + 1}</IconPad>
                        <span className="pt-1.5 leading-relaxed">{objective}</span>
                      </Surface>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {game.screenshots.length > 0 && (
              <Card className="p-6 sm:p-8">
                <SectionHeader level={2} title={t('details.screenshots')} />
                <div className="mt-4">
                  <ScreenshotGallery screenshots={game.screenshots} gameName={game.name} />
                </div>
              </Card>
            )}
          </div>
        </BentoItem>

        {/* ---------------------------------------------------------- Sidebar */}
        <BentoItem span={4} reveal={false} className="sm:col-span-6">
          <aside className="flex flex-col gap-4">
            <Card elevation="featured" className="overflow-hidden p-5">
              <GameThumbnail game={game} tone="onFeatured" className="mb-4" />
              <ButtonExternal
                href={game.launchUrl}
                onClick={onLaunch}
                variant="inverse"
                size="lg"
                className="w-full"
              >
                {t('details.launch')}
                <ExternalLink size={16} aria-hidden="true" />
              </ButtonExternal>
              <p className="mt-3 text-xs leading-relaxed text-on-featured-muted">
                {t('details.launchNote')}
              </p>
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
                          className="inline-flex items-center gap-2 rounded-sm text-sm text-primary transition-colors duration-200 hover:text-primary-hover"
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
        </BentoItem>
      </BentoGrid>
    </PageContainer>
  )
}
