import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, ClipboardList } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ProjectMark } from '@/components/shared/ProjectMark'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

const signupSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Use at least 6 characters'),
  role: z.enum(['property_manager', 'inspector']),
})

type SignupForm = z.infer<typeof signupSchema>

const roleCards: { role: UserRole; title: string; description: string; icon: typeof Building2 }[] = [
  {
    role: 'property_manager' as UserRole,
    title: 'Property Manager',
    description: 'Manage properties, PLOs and work orders',
    icon: Building2,
  },
  {
    role: 'inspector',
    title: 'Inspector',
    description: 'Conduct walkthroughs and log findings',
    icon: ClipboardList,
  },
]

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp, user, profile, loading } = useAuth()
  const { toast } = useToast()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'property_manager',
    },
  })

  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.role === 'property_manager' ? '/property-manager' : profile.role === 'contractor' ? '/contractor' : '/inspector', { replace: true })
    }
  }, [user, profile, loading, navigate])

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await signUp(values)
    if (error) {
      setError('root', { message: error.message })
      return
    }
    toast({
      title: 'Check your email',
      description: 'Confirm your address to finish setting up your account.',
    })
    navigate('/login', { replace: true })
  })

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-6 py-12">
      <Card className="w-full max-w-md border-border shadow-card">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <ProjectMark className="text-2xl" />
          </div>
          <CardTitle className="text-2xl font-semibold">Create your account</CardTitle>
          <CardDescription>Choose your role and add your details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="full_name">
                Full name
              </label>
              <Input id="full_name" autoComplete="name" placeholder="Alex Builder" {...register('full_name')} />
              {errors.full_name ? <p className="text-sm text-danger">{errors.full_name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
              {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Role</p>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {roleCards.map(({ role, title, description, icon: Icon }) => {
                      const selected = field.value === role
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => field.onChange(role)}
                          className={cn(
                            'flex min-h-12 flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-150',
                            selected
                              ? 'border-navy bg-navy/5 shadow-sm'
                              : 'border-border bg-white hover:border-foreground-muted',
                          )}
                        >
                          <Icon className={cn('h-6 w-6', selected ? 'text-navy' : 'text-foreground-secondary')} />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <p className="mt-1 text-xs text-foreground-secondary">{description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              {errors.role ? <p className="text-sm text-danger">{errors.role.message}</p> : null}
            </div>

            {errors.root ? <p className="text-sm text-danger">{errors.root.message}</p> : null}

            <Button className="w-full" type="submit" loading={isSubmitting}>
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-foreground-secondary">
            Already registered?{' '}
            <Link className="font-medium text-navy underline-offset-4 hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
