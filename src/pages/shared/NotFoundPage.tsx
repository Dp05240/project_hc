import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ProjectMark } from '@/components/shared/ProjectMark'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-surface px-6 text-center">
      <ProjectMark className="text-xl" />
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">404</p>
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="max-w-md text-sm text-foreground-secondary">
          The page you are looking for does not exist or you may not have access.
        </p>
      </div>
      <Button type="button" variant="primary" onClick={() => navigate('/')}>
        Go home
      </Button>
    </div>
  )
}
