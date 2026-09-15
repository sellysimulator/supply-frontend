import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
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
  const { user, loading, isAdmin, checkingRole, signIn, signOut } = useAuth()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  if (loading || checkingRole) {
    return (
      <PageContainer>
        <LoadingSection label="Checking your access" />
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
      setError('Sign-in failed. Please try again.')
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
            Administrator sign-in
          </h1>
          <p className="text-muted-foreground">
            This area is for catalog administrators. You do not need an account to browse the
            catalog or open a game.
          </p>
        </div>

        {!user && (
          <Card>
            <CardBody className="flex flex-col gap-4">
              <Button onClick={onSignIn} disabled={busy} size="lg" className="w-full">
                <LogIn size={16} aria-hidden="true" />
                {busy ? 'Redirecting…' : 'Continue with Google'}
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
              <CardTitle>This account is not an administrator</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-4 text-sm text-muted-foreground">
              <p>
                You are signed in as <span className="text-foreground">{user.email}</span>, but this
                account has no administrator record.
              </p>
              <div className="flex flex-col gap-2">
                <p className="font-medium text-foreground">To grant access</p>
                <p>
                  In the Supabase SQL editor, run{' '}
                  <code className="rounded-sm bg-muted px-1 py-0.5 text-foreground">
                    insert into admins (user_id, email) values (&apos;…&apos;, &apos;…&apos;);
                  </code>{' '}
                  with the user id below, then reload this page.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                <code className="flex-1 truncate text-xs text-foreground">{user.id}</code>
                <Button size="sm" variant="secondary" onClick={copyUserId}>
                  {copied ? (
                    <>
                      <Check size={14} aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div>
                <Button variant="ghost" onClick={() => void signOut()}>
                  Sign out
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
