import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'

export function WorkOrderPage() {
  const { id } = useParams()
  return (
    <>
      <PageHeader title={`Work order — ${id ?? ''}`} />
      <p className="text-sm text-foreground-secondary">Printable work order arrives in a later batch.</p>
    </>
  )
}
