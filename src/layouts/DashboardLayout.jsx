import {
  Activity, Bell, Binoculars, Camera, ChevronDown, ChevronRight,
  ClipboardList, FileBarChart, LayoutDashboard, LogOut, Map, MapPinned,
  Menu, Moon, PawPrint, Settings, ShieldAlert, ShieldCheck, Sun,
  Users, X,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { canAccessPage, getCurrentUser } from '../config/roleAccess';

const navigationGroups = [
  {
    heading: 'OVERVIEW',
    links: [{ key: 'dashboard', to: '/dashboard', label: 'Command Center', icon: LayoutDashboard }],
  },
  {
    heading: 'FIELD OPERATIONS',
    links: [
      { key: 'rangers', to: '/rangers', label: 'Ranger Directory', icon: Binoculars },
      { key: 'patrols', to: '/patrols', label: 'Patrol Monitoring', icon: Map },
      { key: 'patrol-routes', to: '/patrol-routes', label: 'Patrol Routes', icon: MapPinned },
      { key: 'incidents', to: '/incidents', label: 'Field Incidents', icon: ShieldAlert },
      { key: 'conflicts', to: '/conflicts', label: 'Conflict Reports', icon: ClipboardList },
    ],
  },
  {
    heading: 'INTELLIGENCE',
    links: [
      { key: 'animals', to: '/animals', label: 'Tracked Wildlife', icon: PawPrint },
      { key: 'risk-zones', to: '/risk-zones', label: 'Risk Zones', icon: Activity },
      { key: 'alerts', to: '/alerts', label: 'Risk Alerts', icon: Bell },
      { key: 'camera-traps', to: '/camera-traps', label: 'Camera Traps', icon: Camera },
      { key: 'reports', to: '/reports', label: 'Reports & Analytics', icon: FileBarChart },
    ],
  },
  {
    heading: 'ADMINISTRATION',
    links: [
      { key: 'users', to: '/users', label: 'User Management', icon: Users },
      { key: 'settings', to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem('wildsentinel-web-theme');
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const user = getCurrentUser();

  useEffect(() => {
    document.documentElement.dataset.wsTheme = theme;
    try { localStorage.setItem('wildsentinel-web-theme', theme); } catch { /* storage optional */ }
  }, [theme]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const sections = useMemo(() => navigationGroups.map((group) => ({
    ...group,
    links: group.links.filter((item) => canAccessPage(user?.role, item.key)),
  })).filter((group) => group.links.length > 0), [user?.role]);

  const currentPage = sections.flatMap((group) => group.links).find(({ to }) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`)
  );
  const heading = currentPage?.label || 'WildSentinel';
  const displayName = user?.name || 'Team member';
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'WS';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  const SidebarContent = () => (
    <>
      <div className="ws-sidebar-brand">
        <div className="ws-sidebar-brand-main">
          <span className="ws-brand-mark"><img src="/brand/wildsentinel-crest.webp" alt="WildSentinel crest" /></span>
          <span className="ws-sidebar-wordmark"><strong>Wild<span>Sentinel</span></strong><small>CONSERVATION INTELLIGENCE</small></span>
        </div>
        <div className="ws-sidebar-edition"><span className="ws-edition-dot" /> COMMAND & MONITORING PLATFORM</div>
      </div>

      <nav className="ws-sidebar-nav" aria-label="Main navigation">
        {sections.map((group) => (
          <div className="ws-sidebar-group" key={group.heading}>
            <div className="ws-sidebar-label">{group.heading}</div>
            {group.links.map(({ key, to, label, icon: Icon }) => (
              <NavLink key={key} to={to} onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `ws-nav-link${isActive ? ' ws-nav-active' : ''}`}>
                <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                <span>{label}</span>
                <ChevronRight size={14} className="ws-nav-chevron" aria-hidden="true" />
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="ws-sidebar-bottom">
        <div className="ws-sidebar-protect"><ShieldCheck size={17} /><span><strong>Protecting what matters.</strong><small>Field operations workspace</small></span></div>
        <button type="button" onClick={handleLogout} className="ws-sidebar-logout"><LogOut size={17} /> Sign out</button>
      </div>
    </>
  );

  return (
    <div className={`ws-shell ws-theme-${theme}`}>
      <aside className="ws-sidebar" aria-label="Application sidebar"><SidebarContent /></aside>
      {mobileMenuOpen && (
        <div className="ws-mobile-navigation">
          <button className="ws-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />
          <aside className="ws-mobile-sidebar"><button className="ws-mobile-close" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}><X size={20}/></button><SidebarContent /></aside>
        </div>
      )}
      <div className="ws-main-area">
        <header className="ws-topbar">
          <div className="ws-topbar-left">
            <button type="button" className="ws-icon-button ws-menu-button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={21}/></button>
            <div className="ws-crumb"><span>WILDSENTINEL</span><ChevronRight size={13}/><strong>{heading}</strong></div>
          </div>
          <div className="ws-topbar-right">
            <span className="ws-topbar-tag"><span className="ws-tag-dot"/> OPERATIONS WORKSPACE</span>
            <button type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="ws-theme-toggle"
              onClick={() => setTheme((existing) => existing === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}
              <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
            </button>
            <div className="ws-topbar-profile"><span className="ws-profile-avatar">{initials}</span><span className="ws-topbar-person"><strong>{displayName}</strong><small>{String(user?.role || 'Authorized user').replaceAll('_', ' ').toLowerCase()}</small></span><ChevronDown size={14} className="ws-profile-chevron" /></div>
          </div>
        </header>
        <main className="ws-workspace" id="main-content"><div className="ws-page" key={location.pathname}><Outlet /></div></main>
        <footer className="ws-footer"><span>© WildSentinel · Conservation Operations</span><span>Built for connected field protection</span></footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
