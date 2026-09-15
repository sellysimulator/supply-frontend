import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { RequireAdmin } from './auth/RequireAdmin'
import Landing from './pages/Landing'
import About from './pages/About'
import Catalog from './pages/Catalog'
import GameDetails from './pages/GameDetails'
import SignIn from './pages/SignIn'
import NotFound from './pages/NotFound'
import { LoadingSection } from './components/ui'

/* The administration area is loaded only when an administrator actually opens
   it, so visitors never download the editing interface. */
const AdminLayout = lazy(() =>
  import('./components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const GamesList = lazy(() => import('./pages/admin/GamesList'))
const GameForm = lazy(() => import('./pages/admin/GameForm'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="about" element={<About />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="games/:gameId" element={<GameDetails />} />
        <Route path="sign-in" element={<SignIn />} />

        {/* The guard is a convenience for the interface. Row level security is
            what actually rejects these reads and writes for non-administrators. */}
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <Suspense fallback={<LoadingSection label="Loading administration" />}>
                <AdminLayout />
              </Suspense>
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="games" element={<GamesList />} />
          <Route path="games/new" element={<GameForm />} />
          <Route path="games/:gameId" element={<GameForm />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
