import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ErrorState } from '../ui'
import { PageContainer } from './Layout'

/**
 * The one top-level error boundary. A render error, or an admin chunk that
 * fails to load (for example after a deploy removed it), would otherwise blank
 * the whole site; this shows the standard error tile with a reload instead.
 * React already logs the error to the console.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <CrashNotice /> : this.props.children
  }
}

function CrashNotice() {
  const { t } = useTranslation()

  return (
    <main id="main" className="w-full">
      <PageContainer>
        <ErrorState
          description={t('common.appCrashed')}
          action={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              {t('common.reload')}
            </Button>
          }
        />
      </PageContainer>
    </main>
  )
}
