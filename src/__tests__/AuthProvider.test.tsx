import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const isAdministrator = vi.fn()

/* Only the session calls AuthProvider makes itself; the admin lookup goes
   through the data layer, mocked below. */
vi.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: { user: { id: 'user-1', email: 'admin@example.com' } } },
        }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
    },
  },
}))
vi.mock('../data/admins', () => ({
  isAdministrator: (userId: string) => isAdministrator(userId),
}))

const { AuthProvider } = await import('../auth/AuthProvider')
const { default: SignIn } = await import('../pages/SignIn')

const renderSignIn = () =>
  render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <AuthProvider>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/admin" element={<p>Admin home</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )

beforeEach(() => {
  isAdministrator.mockReset()
})

describe('administrator check', () => {
  it('lets an administrator through', async () => {
    isAdministrator.mockResolvedValue(true)
    renderSignIn()
    expect(await screen.findByText('Admin home')).toBeInTheDocument()
    expect(isAdministrator).toHaveBeenCalledWith('user-1')
  })

  it('tells a signed-in non-administrator so', async () => {
    isAdministrator.mockResolvedValue(false)
    renderSignIn()
    expect(await screen.findByText('This account is not an administrator')).toBeInTheDocument()
  })

  it('reports a failed lookup with a retry instead of "not an administrator"', async () => {
    isAdministrator.mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValueOnce(true)
    renderSignIn()

    expect(await screen.findByText(/could not be checked/i)).toBeInTheDocument()
    expect(screen.queryByText('This account is not an administrator')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Admin home')).toBeInTheDocument()
    expect(isAdministrator).toHaveBeenCalledTimes(2)
  })
})
