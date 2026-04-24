import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomeRedirect } from '@/components/routing/HomeRedirect'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { BuilderDashboard } from '@/pages/builder/BuilderDashboard'
import { NewPLOPage } from '@/pages/builder/NewPLOPage'
import { NewPropertyPage } from '@/pages/builder/NewPropertyPage'
import { PLODetailPage } from '@/pages/builder/PLODetailPage'
import { PLOsPage } from '@/pages/builder/PLOsPage'
import { PropertiesPage } from '@/pages/builder/PropertiesPage'
import { PropertyDetailPage } from '@/pages/builder/PropertyDetailPage'
import { ReportPage } from '@/pages/builder/ReportPage'
import { WorkOrderPage } from '@/pages/builder/WorkOrderPage'
import { WorkOrdersListPage } from '@/pages/builder/WorkOrdersListPage'
import { CompleteInspectionPage } from '@/pages/inspector/CompleteInspectionPage'
import { InspectionPage } from '@/pages/inspector/InspectionPage'
import { InspectorDashboard } from '@/pages/inspector/InspectorDashboard'
import { ContractorWorkOrdersPage } from '@/pages/contractor/ContractorWorkOrdersPage'
import { ContractorPLOsPage } from '@/pages/contractor/ContractorPLOsPage'
import { ContractorPLODetailPage } from '@/pages/contractor/ContractorPLODetailPage'
import { NotFoundPage } from '@/pages/shared/NotFoundPage'
import { QRScanPage } from '@/pages/shared/QRScanPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<HomeRedirect />} />

      {/* ── Property Manager ────────────────────────────────────── */}
      <Route
        path="/property-manager"
        element={
          <RequireAuth allowedRole="property_manager">
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<BuilderDashboard />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/new" element={<NewPropertyPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="plos" element={<PLOsPage />} />
        <Route path="plos/new" element={<NewPLOPage />} />
        <Route path="plos/:id" element={<PLODetailPage />} />
        <Route path="plos/:id/workorder" element={<WorkOrderPage />} />
        <Route path="plos/:id/report" element={<ReportPage />} />
        <Route path="work-orders" element={<WorkOrdersListPage />} />
      </Route>

      {/* ── Inspector ───────────────────────────────────────────── */}
      <Route
        path="/inspector"
        element={
          <RequireAuth allowedRole="inspector">
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<InspectorDashboard />} />
      </Route>

      <Route
        path="/inspect/:plo_id"
        element={
          <RequireAuth allowedRole="inspector">
            <InspectionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/inspect/:plo_id/complete"
        element={
          <RequireAuth allowedRole="inspector">
            <CompleteInspectionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/scan"
        element={
          <RequireAuth allowedRole="inspector">
            <QRScanPage />
          </RequireAuth>
        }
      />

      {/* ── Contractor (view-only) ───────────────────────────────── */}
      <Route
        path="/contractor"
        element={
          <RequireAuth allowedRole="contractor">
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<ContractorWorkOrdersPage />} />
        <Route path="work-orders" element={<ContractorWorkOrdersPage />} />
        <Route path="plos" element={<ContractorPLOsPage />} />
        <Route path="plos/:id" element={<ContractorPLODetailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
