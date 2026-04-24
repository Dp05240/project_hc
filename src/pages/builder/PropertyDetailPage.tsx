import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'

export function PropertyDetailPage() {
  const { id } = useParams()
  return (
    <>
      <PageHeader title={`Property ${id ?? ''}`} />
      <p className="text-sm text-foreground-secondary">Property detail arrives in the next batch.</p>
    </>
  )
}
