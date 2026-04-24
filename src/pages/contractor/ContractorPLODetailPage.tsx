import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PLODetailPage } from '@/pages/builder/PLODetailPage'

// Contractor gets the same detail view but with no action buttons
// — the PLODetailPage "Submit for Review" only shows for In Progress PLOs
// and the contractor role has no mutation access (Supabase RLS blocks writes).
// We wrap it here so the Back link points to /contractor/plos.
export function ContractorPLODetailPage() {
  return (
    <div>
      <div className="mb-4">
        <Link
          to="/contractor/plos"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All PLOs
        </Link>
      </div>
      <PLODetailPage />
    </div>
  )
}
