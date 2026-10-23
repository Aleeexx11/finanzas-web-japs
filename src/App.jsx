import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import IncomePage from '@/pages/IncomePage'
import ExpensePage from '@/pages/ExpensePage'
import BudgetsPage from '@/pages/BudgetsPage'
import ScheduledMovementsPage from '@/pages/ScheduledMovementsPage'
import SavingsGoalsPage from '@/pages/SavingsGoalsPage'

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
          <Route path="/presupuestos" element={<BudgetsPage />} />
          <Route path="/metas" element={<SavingsGoalsPage />} />
          <Route path="/programados" element={<ScheduledMovementsPage />} />
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
