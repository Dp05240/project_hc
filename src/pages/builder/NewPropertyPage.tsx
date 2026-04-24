import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

const propertySchema = z.object({
  lot_number: z.string().min(1, 'Lot number is required'),
  community_name: z.string().optional(),
  builder_name: z.string().optional(),
  homeowner_name: z.string().min(1, 'Homeowner name is required'),
  homeowner_email: z.string().refine((v) => !v.trim() || z.string().email().safeParse(v.trim()).success, {
    message: 'Enter a valid email',
  }),
  homeowner_phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  last_walkthrough: z.string().optional(),
  next_walkthrough: z.string().optional(),
})

type PropertyFormValues = z.infer<typeof propertySchema>

function emptyToNull(s?: string) {
  const t = s?.trim()
  return t ? t : null
}

export function NewPropertyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      lot_number: '',
      community_name: '',
      builder_name: '',
      homeowner_name: '',
      homeowner_email: '',
      homeowner_phone: '',
      address: '',
      last_walkthrough: '',
      next_walkthrough: '',
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: PropertyFormValues) => {
      if (!user) {
        throw new Error('You must be signed in to save a property.')
      }
      const { error } = await supabase.from('properties').insert({
        lot_number: values.lot_number.trim(),
        community_name: emptyToNull(values.community_name),
        builder_name: emptyToNull(values.builder_name),
        homeowner_name: values.homeowner_name.trim(),
        homeowner_email: emptyToNull(values.homeowner_email),
        homeowner_phone: emptyToNull(values.homeowner_phone),
        address: values.address.trim(),
        last_walkthrough: emptyToNull(values.last_walkthrough),
        next_walkthrough: emptyToNull(values.next_walkthrough),
        created_by: user.id,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({ title: 'Property saved' })
      navigate('/builder/properties', { replace: true })
    },
    onError: (e: Error) => {
      toast({
        title: 'Could not save property',
        description: e.message,
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6">
        <Link
          to="/builder/properties"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <PageHeader title="New Property" className="mb-0 border-0 pb-0" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            className="space-y-8"
            onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          >
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Lot information</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="lot_number">
                  Lot number <span className="text-danger">*</span>
                </label>
                <Input id="lot_number" placeholder="e.g. 175" {...register('lot_number')} />
                {errors.lot_number ? (
                  <p className="text-sm text-danger">{errors.lot_number.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="community_name">
                  Community name
                </label>
                <Input id="community_name" placeholder="Community" {...register('community_name')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="builder_name">
                  Builder name
                </label>
                <Input id="builder_name" placeholder="Builder" {...register('builder_name')} />
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-8">
              <h2 className="text-sm font-semibold text-foreground">Homeowner details</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="homeowner_name">
                  Full name <span className="text-danger">*</span>
                </label>
                <Input id="homeowner_name" {...register('homeowner_name')} />
                {errors.homeowner_name ? (
                  <p className="text-sm text-danger">{errors.homeowner_name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="homeowner_email">
                  Email
                </label>
                <Input id="homeowner_email" type="email" {...register('homeowner_email')} />
                {errors.homeowner_email ? (
                  <p className="text-sm text-danger">{errors.homeowner_email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="homeowner_phone">
                  Phone
                </label>
                <Input id="homeowner_phone" type="tel" {...register('homeowner_phone')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="address">
                  Address <span className="text-danger">*</span>
                </label>
                <Input id="address" {...register('address')} />
                {errors.address ? <p className="text-sm text-danger">{errors.address.message}</p> : null}
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-8">
              <h2 className="text-sm font-semibold text-foreground">Walkthrough schedule</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="last_walkthrough">
                    Last walkthrough
                  </label>
                  <Input id="last_walkthrough" type="date" {...register('last_walkthrough')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="next_walkthrough">
                    Next walkthrough
                  </label>
                  <Input id="next_walkthrough" type="date" {...register('next_walkthrough')} />
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate('/builder/properties')}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
                Save property
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
