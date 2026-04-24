interface AddItemDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddItemDrawer({ open, onOpenChange }: AddItemDrawerProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" role="presentation" onClick={() => onOpenChange(false)}>
      <div
        className="h-[90vh] w-full rounded-t-2xl border border-border bg-white p-4 shadow-lg"
        role="dialog"
        aria-label="Add item"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-foreground-secondary">Add item drawer — coming soon.</p>
      </div>
    </div>
  )
}
