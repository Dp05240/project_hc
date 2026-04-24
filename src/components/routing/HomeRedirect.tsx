import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

export function HomeRedirect() {
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

  return <Navigate to={profile.role === 'property_manager' ? '/property-manager' : profile.role === 'contractor' ? '/contractor' : '/inspector'} replace />
}
