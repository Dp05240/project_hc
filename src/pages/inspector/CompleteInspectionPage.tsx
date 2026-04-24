import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/Button'

export function CompleteInspectionPage() {
  const { plo_id } = useParams()

  return (
    <div className="mx-auto min-h-svh w-full max-w-[390px] bg-background">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy text-white">
        <div className="flex items-center gap-2 px-3 py-3">
          <Link
            to={plo_id ? `/inspect/${plo_id}` : '/inspector'}
            className="flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
            aria-label="Back to inspection"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold">Complete inspection</h1>
            <p className="truncate text-xs text-white/70">Signatures and submission — coming soon.</p>
          </div>
        </div>
      </header>
      <div className="px-3 py-6">
        <p className="text-sm text-foreground-secondary">
          You&apos;ll confirm findings and close out this PLO from this screen. This step is not wired yet.
        </p>
        <Link
          to={plo_id ? `/inspect/${plo_id}` : '/inspector'}
          className={cn(buttonVariants({ variant: 'secondary' }), 'mt-6 inline-flex min-h-14 items-center')}
        >
          Back to inspection
        </Link>
      </div>
    </div>
  )
}
