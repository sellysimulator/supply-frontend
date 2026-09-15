import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Check, Copy, LogIn } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, CardTitle, LoadingSection } from '../components/ui'
import { PageContainer } from '../components/layout/Layout'
import { useAuth } from '../auth/useAuth'

/**
 * Administrator sign-in. Visitors never need this page.
 *
 * When a signed-in account has no row in `admins`, the page shows the account's
 * user id and how to grant it access. That is deliberate: no client path can
 * write to `admins` — which is what stops anyone promoting themselves — and the
 * id is not knowable before the first sign-in.
 */
export default function SignIn() {
  const { t } = useTranslation()
  const { user, loading, isAdmin, checkingRole, signIn, signOut } = useAuth()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  if (loading || checkingRole) {
    return (
      <PageContainer>
        <LoadingSection label={t('signIn.checking')} />
      </PageContainer>
    )
  }

  if (user && isAdmin) {
    return <Navigate to={from} replace />
  }

  const onSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn()
    } catch {
      setError(t('signIn.failed'))
      setBusy(false)
    }
  }

  const copyUserId = async () => {
    if (!user) return
    await navigator.clipboard.writeText(user.id)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('signIn.title')}
          </h1>
          <p className="text-muted-foreground">{t('signIn.description')}</p>
        </div>

        {!user && (
          <Card>
            <CardBody className="flex flex-col gap-4">
              <Button onClick={onSignIn} disabled={busy} size="lg" className="w-full">
                <LogIn size={16} aria-hidden="true" />
                {busy ? t('signIn.redirecting') : t('signIn.continueWithGoogle')}
              </Button>
              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {user && !isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>{t('signIn.notAdminTitle')}</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-4 text-sm text-muted-foreground">
              <p>
                <Trans
                  i18nKey="signIn.notAdminBody"
                  values={{ email: user.email }}
                  components={[<span key="email" className="text-foreground" />]}
                />
              </p>
              <div className="flex flex-col gap-2">
                <p className="font-medium text-foreground">{t('signIn.grantAccess')}</p>
                <p>
                  <Trans
                    i18nKey="signIn.grantAccessBody"
                    components={[
                      <code key="sql" className="rounded-sm bg-muted px-1 py-0.5 text-foreground">
                        insert into admins (user_id, email) values (&apos;…&apos;, &apos;…&apos;);
                      </code>,
                    ]}
                  />
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                <code className="flex-1 truncate text-xs text-foreground">{user.id}</code>
                <Button size="sm" variant="secondary" onClick={copyUserId}>
                  {copied ? (
                    <>
                      <Check size={14} aria-hidden="true" />
                      {t('signIn.copied')}
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" />
                      {t('signIn.copy')}
                    </>
                  )}
                </Button>
              </div>

              <div>
                <Button variant="ghost" onClick={() => void signOut()}>
                  {t('signIn.signOut')}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
