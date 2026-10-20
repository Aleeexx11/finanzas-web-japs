import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import IncomePage from '@/pages/IncomePage'
import ExpensePage from '@/pages/ExpensePage'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/ingresos" element={<IncomePage />} />
          <Route path="/egresos" element={<ExpensePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
