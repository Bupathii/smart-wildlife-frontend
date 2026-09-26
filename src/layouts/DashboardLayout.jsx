import {
  Activity,
  Bell,
  Binoculars,
  Camera,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Menu,
  PawPrint,
  Settings,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';

import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useState } from 'react';

import {
  canAccessPage,
  getCurrentUser,
} from '../config/roleAccess';

const navItems = [
  {
    key: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'rangers',
    to: '/rangers',
    label: 'Rangers',
    icon: Binoculars,
  },
  {
    key: 'patrols',
    to: '/patrols',
    label: 'Patrols',
    icon: Map,
  },
  {
    key: 'patrol-routes',
    to: '/patrol-routes',
    label: 'Patrol Routes',
    icon: MapPinned,
  },
  {
    key: 'incidents',
    to: '/incidents',
    label: 'Incidents',
    icon: ShieldAlert,
  },
  {
    key: 'conflicts',
    to: '/conflicts',
    label: 'Conflict Reports',
    icon: ClipboardList,
  },
  {
    key: 'animals',
    to: '/animals',
    label: 'Animals',
    icon: PawPrint,
  },
  {
    key: 'risk-zones',
    to: '/risk-zones',
    label: 'Risk Zones',
    icon: Activity,
  },
  {
    key: 'alerts',
    to: '/alerts',
    label: 'Risk Alerts',
    icon: Bell,
  },
  {
    key: 'camera-traps',
    to: '/camera-traps',
    label: 'Camera Traps',
    icon: Camera,
  },
  {
    key: 'reports',
    to: '/reports',
    label: 'Reports & Analytics',
    icon: FileBarChart,
  },
  {
    key: 'users',
    to: '/users',
    label: 'User Management',
    icon: Users,
  },
  {
    key: 'settings',
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

function DashboardLayout() {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const user = getCurrentUser();

  const visibleNavItems =
    navItems.filter((item) =>
      canAccessPage(
        user?.role,
        item.key
      )
    );

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    navigate('/login', {
      replace: true,
    });
  }

  const SidebarContent = () => (
    <>
      <div className="border-b border-white/10 px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500">
            <PawPrint
              size={24}
              strokeWidth={2}
            />
          </div>

          <div>
            <h1 className="text-sm font-bold leading-tight text-white">
              Wildlife
              <br />
              Conservation
            </h1>
          </div>
        </div>

        {user && (
          <div className="mt-5 rounded-xl bg-white/10 p-3">
            <p className="truncate text-sm font-semibold text-white">
              {user.name}
            </p>

            <p className="mt-0.5 truncate text-xs text-emerald-200">
              {user.role
                ?.replaceAll('_', ' ')}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNavItems.map(
          ({
            key,
            to,
            label,
            icon: Icon,
          }) => (
            <NavLink
              key={key}
              to={to}
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-emerald-50/80 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <Icon
                size={19}
                strokeWidth={2}
              />

              <span>{label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/15 hover:text-white"
        >
          <LogOut size={19} />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-emerald-950 to-green-900 shadow-xl lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}

      {mobileMenuOpen && (
        <>
          <div
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gradient-to-b from-emerald-950 to-green-900 shadow-2xl lg:hidden">
            <button
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="absolute right-4 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={22} />
            </button>

            <SidebarContent />
          </aside>
        </>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setMobileMenuOpen(true)
              }
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Operations Dashboard
              </p>

              <p className="hidden text-xs text-slate-400 sm:block">
                Smart Wildlife Conservation
                and Anti-Poaching Monitoring
                System
              </p>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-700">
              {user?.name}
            </p>

            <p className="text-xs text-slate-400">
              {user?.email}
            </p>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;