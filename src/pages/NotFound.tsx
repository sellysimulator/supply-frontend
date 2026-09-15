import { ButtonLink } from '../components/ui'
import { PageContainer } from '../components/layout/Layout'

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex flex-col items-start gap-4 py-16">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">Error 404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="max-w-xl text-muted-foreground">
          The page you are looking for does not exist, or has been moved.
        </p>
        <ButtonLink to="/">Return home</ButtonLink>
      </div>
    </PageContainer>
  )
}
