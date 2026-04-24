import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ProjectMark } from '@/components/shared/ProjectMark'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, user, profile, loading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.role === 'property_manager' ? '/property-manager' : profile.role === 'contractor' ? '/contractor' : '/inspector', { replace: true })
    }
  }, [user, profile, loading, navigate])

  const onSubmit = handleSubmit(async (values) => {
    const { error, profile: nextProfile } = await signIn(values.email, values.password)
    if (error) {
      setError('root', { message: error.message })
      return
    }
    if (!nextProfile) {
      setError('root', { message: 'Profile not found. Contact your administrator.' })
      return
    }
    navigate(nextProfile.role === 'property_manager' ? '/property-manager' : nextProfile.role === 'contractor' ? '/contractor' : '/inspector', { replace: true })
  })

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface px-6 py-12">
      <Card className="w-full max-w-md border-border shadow-card">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <ProjectMark className="text-2xl" />
          </div>
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription>Sign in to manage inspections and walkthroughs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
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
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
            </div>
            {errors.root ? <p className="text-sm text-danger">{errors.root.message}</p> : null}
            <Button className="w-full" type="submit" loading={isSubmitting}>
              Sign in
            </Button>
          </form>
          <div className="mt-10 space-y-1 rounded-lg border border-dashed border-border bg-surface/80 px-4 py-3 text-center text-xs text-foreground-muted">
            <p className="font-medium text-foreground-secondary">Demo accounts</p>
            <p>manager@projecthc.demo / demo1234</p>
            <p>inspector@projecthc.demo / demo1234</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
