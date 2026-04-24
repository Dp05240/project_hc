import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'

export function PLODetailPage() {
  const { id } = useParams()
  return (
    <>
      <PageHeader title={`PLO ${id ?? ''}`} />
      <p className="text-sm text-foreground-secondary">PLO detail arrives in a later batch.</p>
    </>
  )
}
