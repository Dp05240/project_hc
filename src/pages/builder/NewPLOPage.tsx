import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useInspectors } from '@/hooks/useInspectors'
import { usePropertiesList } from '@/hooks/useProperties'
import { generateNextPloId } from '@/lib/plo-id'
import { supabase } from '@/lib/supabase'
import type { InspectionType, Property } from '@/lib/types'
import { INSPECTION_TYPE_OPTIONS } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'

const newPloSchema = z.object({
  property_id: z.string().uuid('Select a property'),
  inspection_type: z.enum([
    'Pre-Drywall',
    'Home Demo',
    '30-Day',
    'Interim',
    '1-Year',
  ] as const),
  assigned_inspector_id: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || z.string().uuid().safeParse(v.trim()).success, {
      message: 'Choose an inspector',
    }),
  scheduled_date: z.string().min(1, 'Pick a date'),
  scheduled_time: z.string().optional(),
  notes: z.string().optional(),
})

type NewPloForm = z.infer<typeof newPloSchema>

export function NewPLOPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectPropertyId = searchParams.get('property')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const propertiesQuery = usePropertiesList()
  const inspectorsQuery = useInspectors()

  const [propertyQuery, setPropertyQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewPloForm>({
    resolver: zodResolver(newPloSchema),
    defaultValues: {
      property_id: '',
      inspection_type: 'Home Demo',
      assigned_inspector_id: '',
      scheduled_date: '',
      scheduled_time: '',
      notes: '',
    },
  })

  const propertyId = watch('property_id')
  const allProperties = useMemo(() => propertiesQuery.data ?? [], [propertiesQuery.data])
  const selectedProperty = allProperties.find((p) => p.id === propertyId) ?? null

  const filteredPickList = useMemo(() => {
    const q = propertyQuery.trim().toLowerCase()
    if (!q) return allProperties.slice(0, 12)
    return allProperties
      .filter(
        (p) =>
          p.lot_number.toLowerCase().includes(q) || p.homeowner_name.toLowerCase().includes(q),
      )
      .slice(0, 12)
  }, [allProperties, propertyQuery])

  useEffect(() => {
    if (!preselectPropertyId || !allProperties.length) return
    const match = allProperties.find((p) => p.id === preselectPropertyId)
    if (match) {
      setValue('property_id', match.id, { shouldValidate: true })
      setPropertyQuery('')
      setDropdownOpen(false)
    }
  }, [preselectPropertyId, allProperties, setValue])

  const createMutation = useMutation({
    mutationFn: async (values: NewPloForm) => {
      const plo_id = await generateNextPloId()
      const { data, error } = await supabase
        .from('plos')
        .insert({
          plo_id,
          property_id: values.property_id,
          inspection_type: values.inspection_type as InspectionType,
          assigned_inspector_id: values.assigned_inspector_id?.trim() || null,
          scheduled_date: values.scheduled_date,
          scheduled_time: values.scheduled_time?.trim() || null,
          notes: values.notes?.trim() || null,
          status: 'Scheduled',
        })
        .select('id')
        .single()
      if (error) throw error
      return data as { id: string }
    },
    onSuccess: async (row) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['plos'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['properties'] }),
      ])
      toast({ title: 'PLO created' })
      navigate(`/builder/plos/${row.id}/workorder`, { replace: true })
    },
    onError: (e: Error) => {
      toast({
        title: 'Could not create PLO',
        description: e.message,
        variant: 'destructive',
      })
    },
  })

  const pickProperty = (p: Property) => {
    setValue('property_id', p.id, { shouldValidate: true })
    setPropertyQuery('')
    setDropdownOpen(false)
  }

  const clearProperty = () => {
    setValue('property_id', '', { shouldValidate: true })
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-6">
        <Link
          to="/builder/plos"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to PLOs
        </Link>
        <PageHeader title="New punch list order" className="mb-0 border-0 pb-0" />
      </div>

      <form
        className="space-y-8"
        onSubmit={handleSubmit((values) => createMutation.mutate(values))}
      >
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Property</h2>
          <input type="hidden" {...register('property_id')} />
          {errors.property_id ? (
            <p className="text-sm text-danger">{errors.property_id.message}</p>
          ) : null}

          {!selectedProperty ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
              <Input
                className="pl-10"
                placeholder="Search by lot number or homeowner…"
                value={propertyQuery}
                onChange={(e) => {
                  setPropertyQuery(e.target.value)
                  setDropdownOpen(true)
                }}
                onFocus={() => setDropdownOpen(true)}
                autoComplete="off"
              />
              {dropdownOpen && filteredPickList.length > 0 ? (
                <ul
                  className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
                  role="listbox"
                >
                  {filteredPickList.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm transition-colors hover:bg-surface"
                        onClick={() => pickProperty(p)}
                      >
                        <span className="font-semibold text-foreground">Lot {p.lot_number}</span>
                        <span className="text-foreground-secondary">{p.homeowner_name}</span>
                        <span className="text-xs text-foreground-muted">{p.address}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-bold text-foreground">Lot {selectedProperty.lot_number}</p>
                    {selectedProperty.community_name ? (
                      <Badge variant="outline">{selectedProperty.community_name}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 font-medium text-foreground">{selectedProperty.homeowner_name}</p>
                  <p className="text-sm text-foreground-secondary">{selectedProperty.address}</p>
                </div>
                <Button type="button" variant="ghost" className="shrink-0 self-start" onClick={clearProperty}>
                  Change
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-sm font-semibold text-foreground">Inspection details</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="inspection_type">
              Inspection type <span className="text-danger">*</span>
            </label>
            <Controller
              name="inspection_type"
              control={control}
              render={({ field }) => (
                <Select id="inspection_type" {...field}>
                  {INSPECTION_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.inspection_type ? (
              <p className="text-sm text-danger">{errors.inspection_type.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="assigned_inspector_id">
              Assign inspector
            </label>
            <Controller
              name="assigned_inspector_id"
              control={control}
              render={({ field }) => (
                <Select id="assigned_inspector_id" {...field} disabled={inspectorsQuery.isLoading}>
                  <option value="">Not assigned</option>
                  {(inspectorsQuery.data ?? []).map((insp) => (
                    <option key={insp.id} value={insp.id}>
                      {insp.full_name}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.assigned_inspector_id ? (
              <p className="text-sm text-danger">{errors.assigned_inspector_id.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="scheduled_date">
                Date <span className="text-danger">*</span>
              </label>
              <Input id="scheduled_date" type="date" {...register('scheduled_date')} />
              {errors.scheduled_date ? (
                <p className="text-sm text-danger">{errors.scheduled_date.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="scheduled_time">
                Time
              </label>
              <Input id="scheduled_time" type="time" {...register('scheduled_time')} />
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t border-border pt-8">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          <Textarea placeholder="Optional notes for the inspector…" rows={4} {...register('notes')} />
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate('/builder/plos')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            loading={isSubmitting || createMutation.isPending}
            disabled={propertiesQuery.isLoading}
          >
            Create PLO
          </Button>
        </div>
      </form>
    </div>
  )
}
