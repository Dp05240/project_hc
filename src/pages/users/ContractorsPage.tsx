import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, PlusCircle, HardHat } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useContractors, useCreateContractor, useUpdateContractor } from '@/hooks/useContractors'
import type { Contractor, TradeType } from '@/lib/types'
import { TRADE_TYPE_OPTIONS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  company_name: z.string().optional(),
  trade_type: z.string().min(1, 'Select a trade'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function ContractorsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: contractors = [], isLoading, error } = useContractors()
  const createMutation = useCreateContractor()
  const updateMutation = useUpdateContractor()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contractor | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const openAdd = () => {
    setEditing(null)
    reset({ full_name: '', company_name: '', trade_type: undefined, email: '', phone: '' })
    setModalOpen(true)
  }

  const openEdit = (c: Contractor) => {
    setEditing(c)
    reset({
      full_name: c.full_name,
      company_name: c.company_name ?? '',
      trade_type: c.trade_type ?? undefined,
      email: c.email ?? '',
      phone: c.phone ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      full_name: values.full_name.trim(),
      company_name: values.company_name?.trim() || undefined,
      trade_type: values.trade_type as TradeType | undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload })
        toast({ title: 'Contractor updated' })
      } else {
        await createMutation.mutateAsync({ ...payload, created_by: user!.id })
        toast({ title: 'Contractor added' })
      }
      setModalOpen(false)
    } catch (e) {
      toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' })
    }
  })

  const toggleActive = async (c: Contractor) => {
    try {
      await updateMutation.mutateAsync({ id: c.id, is_active: !c.is_active })
      toast({ title: c.is_active ? 'Contractor deactivated' : 'Contractor activated' })
    } catch (e) {
      toast({ title: 'Could not update', description: (e as Error).message, variant: 'destructive' })
    }
  }

  if (isLoading) return <LoadingState className="min-h-[40vh]" label="Loading contractors…" />
  if (error) return <p className="text-sm text-danger">{error.message}</p>

  return (
    <>
      <PageHeader
        title="Contractors"
        actions={
          <button
            type="button"
            onClick={openAdd}
            className={cn(buttonVariants({ variant: 'accent' }), 'inline-flex items-center gap-2')}
          >
            <PlusCircle className="h-4 w-4" />
            Add Contractor
          </button>
        }
      />

      {contractors.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="No contractors added yet"
          description="Add contractors to assign them to work orders."
          action={
            <button type="button" onClick={openAdd} className={cn(buttonVariants({ variant: 'accent' }))}>
              Add Contractor
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/60">
                {['Name', 'Company', 'Trade', 'Email', 'Phone', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contractors.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface/40">
                  <td className="px-4 py-3 font-medium text-foreground">{c.full_name}</td>
                  <td className="px-4 py-3 text-foreground-secondary">{c.company_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.trade_type ? (
                      <Badge variant="secondary">{c.trade_type}</Badge>
                    ) : <span className="text-foreground-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground-secondary">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn('border text-xs font-medium', c.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-100 text-gray-500')}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground-secondary hover:text-foreground"
                        aria-label="Edit contractor"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(c)}
                        disabled={updateMutation.isPending}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          c.is_active
                            ? 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
                        )}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
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
        title={editing ? 'Edit Contractor' : 'Add Contractor'}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="cont_name">
              Full Name <span className="text-danger">*</span>
            </label>
            <Input id="cont_name" placeholder="John Doe" {...register('full_name')} />
            {errors.full_name ? <p className="text-sm text-danger">{errors.full_name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="cont_company">
              Company Name
            </label>
            <Input id="cont_company" placeholder="Ace Plumbing LLC" {...register('company_name')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="cont_trade">
              Trade <span className="text-danger">*</span>
            </label>
            <Controller
              name="trade_type"
              control={control}
              render={({ field }) => (
                <Select id="cont_trade" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value as TradeType)}>
                  <option value="">Select trade…</option>
                  {TRADE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              )}
            />
            {errors.trade_type ? <p className="text-sm text-danger">{errors.trade_type.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="cont_email">
              Email
            </label>
            <Input id="cont_email" type="email" placeholder="john@example.com" {...register('email')} />
            {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="cont_phone">
              Phone
            </label>
            <Input id="cont_phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save changes' : 'Add Contractor'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
