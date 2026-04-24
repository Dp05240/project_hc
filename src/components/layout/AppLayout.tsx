import {
  Building2,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  QrCode,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProjectMark } from '@/components/shared/ProjectMark'

const desktopNavClass =
  'flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground-secondary transition-all duration-150'

const mobileNavClass =
  'flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-150'

function NavItems({ role, mobile }: { role: UserRole; mobile: boolean }) {
  const base = mobile ? mobileNavClass : desktopNavClass
  const activeDesktop = 'bg-navy text-white'
  const inactiveDesktop = 'hover:bg-surface hover:text-foreground'
  const activeMobile = 'text-accent'
  const inactiveMobile = 'text-foreground-secondary'

  if (role === 'builder') {
    return (
      <>
        <NavLink
          to="/builder"
          end
          className={({ isActive }) =>
            cn(
              base,
              mobile
                ? isActive
                  ? activeMobile
                  : inactiveMobile
                : isActive
                  ? activeDesktop
                  : inactiveDesktop,
            )
          }
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/builder/properties"
          className={({ isActive }) =>
            cn(
              base,
              mobile
                ? isActive
                  ? activeMobile
                  : inactiveMobile
                : isActive
                  ? activeDesktop
                  : inactiveDesktop,
            )
          }
        >
          <Building2 className="h-5 w-5 shrink-0" />
          <span>Properties</span>
        </NavLink>
        <NavLink
          to="/builder/plos"
          className={({ isActive }) =>
            cn(
              base,
              mobile
                ? isActive
                  ? activeMobile
                  : inactiveMobile
                : isActive
                  ? activeDesktop
                  : inactiveDesktop,
            )
          }
        >
          <ClipboardList className="h-5 w-5 shrink-0" />
          <span>PLOs</span>
        </NavLink>
      </>
    )
  }

  return (
    <>
      <NavLink
        to="/inspector"
        end
        className={({ isActive }) =>
          cn(
            base,
            mobile
              ? isActive
                ? activeMobile
                : inactiveMobile
              : isActive
                ? activeDesktop
                : inactiveDesktop,
          )
        }
      >
        <Calendar className="h-5 w-5 shrink-0" />
        <span>My Jobs</span>
      </NavLink>
      <NavLink
        to="/scan"
        className={({ isActive }) =>
          cn(
            base,
            mobile
              ? isActive
                ? activeMobile
                : inactiveMobile
              : isActive
                ? activeDesktop
                : inactiveDesktop,
          )
        }
      >
        <QrCode className="h-5 w-5 shrink-0" />
        <span>Scan QR</span>
      </NavLink>
    </>
  )
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  if (!profile) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4 print:hidden md:hidden">
        <ProjectMark className="text-base" />
        <Button variant="ghost" size="icon" type="button" onClick={() => void handleSignOut()}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-white print:hidden md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <ProjectMark className="text-lg" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          <NavItems role={profile.role} mobile={false} />
        </nav>
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{profile.full_name}</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {profile.role}
              </Badge>
            </div>
          </div>
          <Button variant="secondary" className="w-full" type="button" onClick={() => void handleSignOut()}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <main className="pb-24 md:ml-60 md:pb-0 print:ml-0 print:pb-0">
        <div
          className={cn(
            'mx-auto w-full px-6 py-8 print:px-4 print:py-4 md:px-8',
            profile.role === 'builder' ? 'max-w-[900px]' : 'max-w-content',
          )}
        >
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white px-2 py-2 print:hidden md:hidden">
        <div
          className={cn(
            'mx-auto flex justify-between gap-1',
            profile.role === 'builder' ? 'max-w-[900px]' : 'max-w-content',
          )}
        >
          <NavItems role={profile.role} mobile />
        </div>
      </nav>
    </div>
  )
}
