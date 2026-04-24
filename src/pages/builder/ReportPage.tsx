import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'

export function ReportPage() {
  const { id } = useParams()
  return (
    <>
      <PageHeader title={`Report — ${id ?? ''}`} />
      <p className="text-sm text-foreground-secondary">Report export arrives in a later batch.</p>
    </>
  )
}
