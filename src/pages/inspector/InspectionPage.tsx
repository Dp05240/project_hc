import { useParams } from 'react-router-dom'

export function InspectionPage() {
  const { plo_id } = useParams()
  return (
    <div className="min-h-svh bg-background px-4 py-6">
      <p className="text-sm text-foreground-secondary">Inspection workspace for {plo_id} — coming soon.</p>
    </div>
  )
}
