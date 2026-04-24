import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, PlusCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useInspectors, useCreateInspector, useUpdateInspector } from '@/hooks/useInspectors'
import type { Inspector } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function InspectorsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: inspectors = [], isLoading, error } = useInspectors()
  const createMutation = useCreateInspector()
  const updateMutation = useUpdateInspector()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Inspector | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const openAdd = () => {
    setEditing(null)
    reset({ full_name: '', email: '', phone: '' })
    setModalOpen(true)
  }

  const openEdit = (insp: Inspector) => {
    setEditing(insp)
    reset({ full_name: insp.full_name, email: insp.email ?? '', phone: insp.phone ?? '' })
    setModalOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      full_name: values.full_name.trim(),
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload })
        toast({ title: 'Inspector updated' })
      } else {
        await createMutation.mutateAsync({ ...payload, created_by: user!.id })
        toast({ title: 'Inspector added' })
      }
      setModalOpen(false)
    } catch (e) {
      toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' })
    }
  })

  const toggleActive = async (insp: Inspector) => {
    try {
      await updateMutation.mutateAsync({ id: insp.id, is_active: !insp.is_active })
      toast({ title: insp.is_active ? 'Inspector deactivated' : 'Inspector activated' })
    } catch (e) {
      toast({ title: 'Could not update', description: (e as Error).message, variant: 'destructive' })
    }
  }

  if (isLoading) return <LoadingState className="min-h-[40vh]" label="Loading inspectors…" />
  if (error) return <p className="text-sm text-danger">{error.message}</p>

  return (
    <>
      <PageHeader
        title="Inspectors"
        actions={
          <button
            type="button"
            onClick={openAdd}
            className={cn(buttonVariants({ variant: 'accent' }), 'inline-flex items-center gap-2')}
          >
            <PlusCircle className="h-4 w-4" />
            Add Inspector
          </button>
        }
      />

      {inspectors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No inspectors added yet"
          description="Add your first inspector to assign them to PLOs."
          action={
            <button type="button" onClick={openAdd} className={cn(buttonVariants({ variant: 'accent' }))}>
              Add Inspector
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/60">
                {['Name', 'Email', 'Phone', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inspectors.map((insp) => (
                <tr key={insp.id} className="transition-colors hover:bg-surface/40">
                  <td className="px-4 py-3 font-medium text-foreground">{insp.full_name}</td>
                  <td className="px-4 py-3 text-foreground-secondary">{insp.email ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground-secondary">{insp.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn('border text-xs font-medium', insp.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-100 text-gray-500')}>
                      {insp.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(insp)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground-secondary hover:text-foreground"
                        aria-label="Edit inspector"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(insp)}
                        disabled={updateMutation.isPending}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          insp.is_active
                            ? 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
                        )}
                      >
                        {insp.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Inspector' : 'Add Inspector'}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="full_name">
              Full Name <span className="text-danger">*</span>
            </label>
            <Input id="full_name" placeholder="Jane Smith" {...register('full_name')} />
            {errors.full_name ? <p className="text-sm text-danger">{errors.full_name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="insp_email">
              Email
            </label>
            <Input id="insp_email" type="email" placeholder="jane@example.com" {...register('email')} />
            {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="insp_phone">
              Phone
            </label>
            <Input id="insp_phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save changes' : 'Add Inspector'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
