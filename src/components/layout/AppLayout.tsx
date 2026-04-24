import {
  Building2,
  Briefcase,
  Calendar,
  ChevronDown,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  LogOut,
  QrCode,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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

function PMNav({ mobile }: { mobile: boolean }) {
  const base = mobile ? mobileNavClass : desktopNavClass
  const activeDesktop = 'bg-navy text-white'
  const inactiveDesktop = 'hover:bg-surface hover:text-foreground'
  const activeMobile = 'text-accent'
  const inactiveMobile = 'text-foreground-secondary'

  const cls = ({ isActive }: { isActive: boolean }) =>
    cn(base, mobile ? (isActive ? activeMobile : inactiveMobile) : isActive ? activeDesktop : inactiveDesktop)

  const location = useLocation()
  const onUsersRoute = location.pathname.startsWith('/property-manager/users')
  const [usersOpen, setUsersOpen] = useState(onUsersRoute)

  if (mobile) {
    return (
      <>
        <NavLink to="/property-manager" end className={cls}><LayoutDashboard className="h-5 w-5 shrink-0" /><span>Dashboard</span></NavLink>
        <NavLink to="/property-manager/properties" className={cls}><Building2 className="h-5 w-5 shrink-0" /><span>Properties</span></NavLink>
        <NavLink to="/property-manager/plos" className={cls}><ClipboardList className="h-5 w-5 shrink-0" /><span>PLOs</span></NavLink>
        <NavLink to="/property-manager/work-orders" className={cls}><Briefcase className="h-5 w-5 shrink-0" /><span>Orders</span></NavLink>
        <NavLink to="/property-manager/users/inspectors" className={cls}><Users className="h-5 w-5 shrink-0" /><span>Users</span></NavLink>
      </>
    )
  }

  return (
    <>
      <NavLink to="/property-manager" end className={cls}>
        <LayoutDashboard className="h-5 w-5 shrink-0" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/property-manager/properties" className={cls}>
        <Building2 className="h-5 w-5 shrink-0" />
        <span>Properties</span>
      </NavLink>
      <NavLink to="/property-manager/plos" className={cls}>
        <ClipboardList className="h-5 w-5 shrink-0" />
        <span>PLOs</span>
      </NavLink>
      <NavLink to="/property-manager/work-orders" className={cls}>
        <Briefcase className="h-5 w-5 shrink-0" />
        <span>Work Orders</span>
      </NavLink>

      {/* Users — expandable */}
      <button
        type="button"
        onClick={() => setUsersOpen((o) => !o)}
        className={cn(
          base,
          'justify-between',
          onUsersRoute ? activeDesktop : inactiveDesktop,
        )}
      >
        <span className="flex items-center gap-3">
          <Users className="h-5 w-5 shrink-0" />
          <span>Users</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-150', usersOpen && 'rotate-180')} />
      </button>

      {usersOpen && (
        <div className="ml-3 flex flex-col gap-0.5 border-l-2 border-border pl-3">
          <NavLink
            to="/property-manager/users/inspectors"
            className={({ isActive }) =>
              cn('flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-navy text-white' : 'text-foreground-secondary hover:bg-surface hover:text-foreground')
            }
          >
            <Calendar className="h-4 w-4 shrink-0" />
            Inspectors
          </NavLink>
          <NavLink
            to="/property-manager/users/contractors"
            className={({ isActive }) =>
              cn('flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-navy text-white' : 'text-foreground-secondary hover:bg-surface hover:text-foreground')
            }
          >
            <HardHat className="h-4 w-4 shrink-0" />
            Contractors
          </NavLink>
        </div>
      )}
    </>
  )
}

function NavItems({ role, mobile }: { role: UserRole; mobile: boolean }) {
  const base = mobile ? mobileNavClass : desktopNavClass
  const activeDesktop = 'bg-navy text-white'
  const inactiveDesktop = 'hover:bg-surface hover:text-foreground'
  const activeMobile = 'text-accent'
  const inactiveMobile = 'text-foreground-secondary'

  const cls = ({ isActive }: { isActive: boolean }) =>
    cn(base, mobile ? (isActive ? activeMobile : inactiveMobile) : isActive ? activeDesktop : inactiveDesktop)

  if (role === 'property_manager') return <PMNav mobile={mobile} />

  if (role === 'contractor') {
    return (
      <>
        <NavLink to="/contractor/work-orders" className={cls}><Briefcase className="h-5 w-5 shrink-0" /><span>Work Orders</span></NavLink>
        <NavLink to="/contractor/plos" className={cls}><ClipboardList className="h-5 w-5 shrink-0" /><span>PLOs</span></NavLink>
      </>
    )
  }

  return (
    <>
      <NavLink to="/inspector" end className={cls}><Calendar className="h-5 w-5 shrink-0" /><span>My Jobs</span></NavLink>
      <NavLink to="/scan" className={cls}><QrCode className="h-5 w-5 shrink-0" /><span>Scan QR</span></NavLink>
    </>
  )
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  if (!profile) return null

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const isPm = profile.role === 'property_manager'

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
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <NavItems role={profile.role} mobile={false} />
        </nav>
        <div className="space-y-3 border-t border-border p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{profile.full_name}</p>
            <Badge variant="secondary" className="mt-1 capitalize">
              {profile.role.replace('_', ' ')}
            </Badge>
          </div>
          <Button variant="secondary" className="w-full" type="button" onClick={() => void handleSignOut()}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <main className="pb-24 md:ml-60 md:pb-0 print:ml-0 print:pb-0">
        <div className={cn('mx-auto w-full px-6 py-8 print:px-4 print:py-4 md:px-8', isPm ? 'max-w-[900px]' : 'max-w-content')}>
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white px-2 py-2 print:hidden md:hidden">
        <div className={cn('mx-auto flex justify-between gap-1', isPm ? 'max-w-[900px]' : 'max-w-content')}>
          <NavItems role={profile.role} mobile />
        </div>
      </nav>
    </div>
  )
}
