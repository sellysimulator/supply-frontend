import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ErrorState,
  Field,
  Input,
  LoadingSection,
  TagInput,
  Textarea,
} from '../../components/ui'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { ResourceListEditor } from '../../components/admin/ResourceListEditor'
import { createGame, gameIdExists, getGame, updateGame } from '../../data/games'
import { emptyGameInput, gameFormSchema, gameIdSchema, type GameInput } from '../../types/game'
import { useAsync } from '../../hooks/useAsync'

/** `Beer Game` → `beer-game`. Suggested for new entries, always editable. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export default function GameForm() {
  const { t } = useTranslation()
  const { gameId } = useParams<{ gameId: string }>()
  const isEditing = Boolean(gameId)
  const navigate = useNavigate()

  const {
    data: existing,
    loading,
    error,
  } = useAsync(() => (gameId ? getGame(gameId) : Promise.resolve(null)), [gameId])

  /* For a new entry the identifier is part of the form, because it becomes the
     primary key and the public URL. For an existing entry it is immutable —
     changing it would orphan the analytics counters keyed on it. */
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  /* Validation failures are held as translation keys and resolved when they are
     rendered, so switching language re-renders the message rather than leaving
     the previous language's sentence on screen. */
  const [slugErrorKey, setSlugErrorKey] = useState<string | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)

  const message = (key?: string) => (key ? t(key) : undefined)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GameInput>({
    resolver: zodResolver(gameFormSchema) as Resolver<GameInput>,
    defaultValues: emptyGameInput,
  })

  useEffect(() => {
    if (existing) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = existing
      reset(input)
      setSlug(existing.id)
    }
  }, [existing, reset])

  const name = watch('name')
  useEffect(() => {
    if (!isEditing && !slugTouched) setSlug(slugify(name ?? ''))
  }, [name, isEditing, slugTouched])

  const effectiveId = useMemo(() => (isEditing ? (gameId ?? '') : slug), [isEditing, gameId, slug])

  const onSubmit = handleSubmit(async (values) => {
    setSaveFailed(false)
    setSlugErrorKey(null)

    if (!isEditing) {
      const parsed = gameIdSchema.safeParse(slug)
      if (!parsed.success) {
        setSlugErrorKey(parsed.error.issues[0]?.message ?? 'validation.identifierFormat')
        return
      }
      if (await gameIdExists(slug)) {
        setSlugErrorKey('admin.form.identifierTaken')
        return
      }
    }

    try {
      if (isEditing && gameId) {
        await updateGame(gameId, values)
      } else {
        await createGame(slug, values)
      }
      navigate('/admin/games')
    } catch {
      setSaveFailed(true)
    }
  })

  if (isEditing && loading) return <LoadingSection label={t('admin.form.loading')} />

  if (isEditing && (error || !existing)) {
    return (
      <ErrorState
        title={t('admin.form.notFoundTitle')}
        description={t('admin.form.notFoundDescription')}
        action={
          <Button variant="secondary" onClick={() => navigate('/admin/games')}>
            {t('admin.form.back')}
          </Button>
        }
      />
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate('/admin/games')}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            {t('admin.form.back')}
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? t('admin.form.edit', { name: existing?.name ?? '' }) : t('admin.form.add')}
          </h2>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          <Save size={16} aria-hidden="true" />
          {isSubmitting
            ? t('admin.form.saving')
            : t(isEditing ? 'admin.form.saveChanges' : 'admin.form.create')}
        </Button>
      </div>

      {saveFailed && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {t('admin.form.saveFailed')}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.form.identitySection')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <Field label={t('admin.form.name')} required error={message(errors.name?.message)}>
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} {...register('name')} />
            )}
          </Field>

          <Field
            label={t('admin.form.identifier')}
            required
            hint={t(isEditing ? 'admin.form.identifierLockedHint' : 'admin.form.identifierHint')}
            error={message(slugErrorKey ?? undefined)}
          >
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={effectiveId}
                readOnly={isEditing}
                disabled={isEditing}
                onChange={(event) => {
                  setSlugTouched(true)
                  setSlug(event.target.value)
                }}
              />
            )}
          </Field>

          <Field
            label={t('admin.form.shortDescription')}
            required
            hint={t('admin.form.shortDescriptionHint')}
            error={message(errors.shortDescription?.message)}
          >
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                maxLength={200}
                {...register('shortDescription')}
              />
            )}
          </Field>

          <Field
            label={t('admin.form.fullDescription')}
            required
            hint={t('admin.form.fullDescriptionHint')}
            error={message(errors.fullDescription?.message)}
          >
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                rows={8}
                {...register('fullDescription')}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.form.sessionSection')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field
              label={t('admin.form.minPlayers')}
              required
              error={message(errors.minPlayers?.message)}
            >
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="number"
                  min={1}
                  {...register('minPlayers', { valueAsNumber: true })}
                />
              )}
            </Field>
            <Field
              label={t('admin.form.maxPlayers')}
              required
              error={message(errors.maxPlayers?.message)}
            >
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="number"
                  min={1}
                  {...register('maxPlayers', { valueAsNumber: true })}
                />
              )}
            </Field>
            <Field
              label={t('admin.form.duration')}
              required
              error={message(errors.durationMinutes?.message)}
            >
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="number"
                  min={1}
                  {...register('durationMinutes', { valueAsNumber: true })}
                />
              )}
            </Field>
          </div>

          <Field label={t('admin.form.audience')} hint={t('admin.form.audienceHint')}>
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} {...register('audience')} />
            )}
          </Field>

          <Field label={t('admin.form.objectives')} hint={t('admin.form.objectivesHint')}>
            {({ id, describedBy }) => (
              <Controller
                control={control}
                name="learningObjectives"
                render={({ field }) => (
                  <TagInput
                    id={id}
                    describedBy={describedBy}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder={t('admin.form.objectivesPlaceholder')}
                  />
                )}
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={t('admin.form.categories')} hint={t('admin.form.categoriesHint')}>
              {({ id, describedBy }) => (
                <Controller
                  control={control}
                  name="categories"
                  render={({ field }) => (
                    <TagInput
                      id={id}
                      describedBy={describedBy}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder={t('admin.form.categoriesPlaceholder')}
                    />
                  )}
                />
              )}
            </Field>
            <Field label={t('admin.form.tags')}>
              {({ id, describedBy }) => (
                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <TagInput
                      id={id}
                      describedBy={describedBy}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder={t('admin.form.tagsPlaceholder')}
                    />
                  )}
                />
              )}
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.form.mediaSection')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{t('admin.form.thumbnail')}</p>
            <Controller
              control={control}
              name="thumbnail"
              render={({ field }) => (
                <ImageUploader
                  label={t('admin.form.thumbnail')}
                  gameId={effectiveId}
                  images={field.value ? [field.value] : []}
                  onChange={(next) => field.onChange(next[0] ?? null)}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{t('admin.form.screenshots')}</p>
            <Controller
              control={control}
              name="screenshots"
              render={({ field }) => (
                <ImageUploader
                  label={t('admin.form.screenshots')}
                  gameId={effectiveId}
                  images={field.value ?? []}
                  onChange={field.onChange}
                  multiple
                />
              )}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.form.linksSection')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <Field
            label={t('admin.form.launchUrl')}
            required
            hint={t('admin.form.launchUrlHint')}
            error={message(errors.launchUrl?.message)}
          >
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                placeholder={t('admin.form.launchUrlPlaceholder')}
                {...register('launchUrl')}
              />
            )}
          </Field>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{t('admin.form.resources')}</p>
            <Controller
              control={control}
              name="resources"
              render={({ field }) => (
                <ResourceListEditor resources={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </div>

          <Field label={t('admin.form.sortOrder')} hint={t('admin.form.sortOrderHint')}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="number"
                className="sm:w-40"
                {...register('sortOrder', { valueAsNumber: true })}
              />
            )}
          </Field>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              {...register('published')}
              className="mt-1 h-4 w-4 cursor-pointer accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {t('admin.form.published')}
              </span>
              <span className="text-xs text-muted-foreground">{t('admin.form.publishedHint')}</span>
            </span>
          </label>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/admin/games')}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save size={16} aria-hidden="true" />
          {isSubmitting
            ? t('admin.form.saving')
            : t(isEditing ? 'admin.form.saveChanges' : 'admin.form.create')}
        </Button>
      </div>
    </form>
  )
}
