import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/lib/types'
import { Spinner } from '@/components/ui/Spinner'

interface RequireAuthProps {
  allowedRole?: UserRole
  children: ReactNode
}

function roleHome(role: string): string {
  if (role === 'property_manager') return '/property-manager'
  if (role === 'contractor') return '/contractor'
  return '/inspector'
}

export function RequireAuth({ allowedRole, children }: RequireAuthProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && profile.role !== allowedRole) {
    return <Navigate to={roleHome(profile.role)} replace />
  }

  return <>{children}</>
}
