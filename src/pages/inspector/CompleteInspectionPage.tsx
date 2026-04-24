import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'

export function CompleteInspectionPage() {
  const { plo_id } = useParams()
  return (
    <div className="mx-auto max-w-content px-6 py-8 md:px-8">
      <PageHeader title="Complete Inspection" subtitle={plo_id} />
      <p className="text-sm text-foreground-secondary">Signatures and submission — coming soon.</p>
    </div>
  )
}
