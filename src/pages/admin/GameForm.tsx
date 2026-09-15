import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  const [slugError, setSlugError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    setSaveError(null)
    setSlugError(null)

    if (!isEditing) {
      const parsed = gameIdSchema.safeParse(slug)
      if (!parsed.success) {
        setSlugError(parsed.error.issues[0]?.message ?? 'Invalid identifier')
        return
      }
      if (await gameIdExists(slug)) {
        setSlugError('A game with this identifier already exists')
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
      setSaveError(
        'Saving failed. Check that you are still signed in as an administrator and try again.',
      )
    }
  })

  if (isEditing && loading) return <LoadingSection label="Loading game" />

  if (isEditing && (error || !existing)) {
    return (
      <ErrorState
        title="Game not found"
        description="This catalog entry could not be loaded."
        action={
          <Button variant="secondary" onClick={() => navigate('/admin/games')}>
            Back to games
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
            Back to games
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? `Edit ${existing?.name}` : 'Add a game'}
          </h2>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          <Save size={16} aria-hidden="true" />
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create game'}
        </Button>
      </div>

      {saveError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {saveError}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <Field label="Name" required error={errors.name?.message}>
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} {...register('name')} />
            )}
          </Field>

          <Field
            label="Identifier"
            required
            hint={
              isEditing
                ? 'The identifier cannot be changed — analytics are recorded against it.'
                : 'Used in the address of the game page, for example /games/beer-game.'
            }
            error={slugError ?? undefined}
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
            label="Catalog summary"
            required
            hint="One sentence shown on the catalog card."
            error={errors.shortDescription?.message}
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
            label="Full description"
            required
            hint="Shown on the game's details page. Leave a blank line between paragraphs."
            error={errors.fullDescription?.message}
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
          <CardTitle>Session details</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Minimum players" required error={errors.minPlayers?.message}>
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
            <Field label="Maximum players" required error={errors.maxPlayers?.message}>
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
            <Field label="Duration (minutes)" required error={errors.durationMinutes?.message}>
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

          <Field label="Intended audience" hint="For example: undergraduate operations students.">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} {...register('audience')} />
            )}
          </Field>

          <Field label="Learning objectives" hint="One per entry. Press Enter to add.">
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
                    placeholder="Understand the bullwhip effect"
                  />
                )}
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Categories" hint="Used by the catalog filter.">
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
                      placeholder="Simulation"
                    />
                  )}
                />
              )}
            </Field>
            <Field label="Tags">
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
                      placeholder="bullwhip"
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
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Thumbnail</p>
            <Controller
              control={control}
              name="thumbnail"
              render={({ field }) => (
                <ImageUploader
                  label="Thumbnail"
                  gameId={effectiveId}
                  images={field.value ? [field.value] : []}
                  onChange={(next) => field.onChange(next[0] ?? null)}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Screenshots</p>
            <Controller
              control={control}
              name="screenshots"
              render={({ field }) => (
                <ImageUploader
                  label="Screenshots"
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
          <CardTitle>Links and publication</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <Field
            label="Launch URL"
            required
            hint="Where the game runs. Must start with https://."
            error={errors.launchUrl?.message}
          >
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                placeholder="https://example.com/game"
                {...register('launchUrl')}
              />
            )}
          </Field>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Instructions and resources</p>
            <Controller
              control={control}
              name="resources"
              render={({ field }) => (
                <ResourceListEditor resources={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </div>

          <Field label="Sort order" hint="Lower numbers appear first in the catalog.">
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
              <span className="text-sm font-medium text-foreground">Published</span>
              <span className="text-xs text-muted-foreground">
                Published games are visible to everyone in the public catalog.
              </span>
            </span>
          </label>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/admin/games')}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save size={16} aria-hidden="true" />
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create game'}
        </Button>
      </div>
    </form>
  )
}
