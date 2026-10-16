import {
  Activity, ArrowRight, BellRing, Binoculars, ChevronRight, CircleAlert,
  ClipboardList, Clock3, Fingerprint, MapPinned, PawPrint, Radar,
  RadioTower, Shield, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import { canAccessPage, getCurrentUser } from '../config/roleAccess';

const shortcuts = [
  { key: 'patrols', title: 'Patrol Monitoring', detail: 'Routes, progress & field teams', to: '/patrols', icon: Binoculars, hue: 'emerald' },
  { key: 'conflicts', title: 'Conflict Reports', detail: 'Community sightings & reports', to: '/conflicts', icon: ClipboardList, hue: 'amber' },
  { key: 'animals', title: 'Wildlife Tracking', detail: 'Collar locations & movement', to: '/animals', icon: PawPrint, hue: 'mint' },
  { key: 'risk-zones', title: 'Risk Zone Map', detail: 'Monitor vulnerable boundaries', to: '/risk-zones', icon: MapPinned, hue: 'violet' },
  { key: 'alerts', title: 'Risk Alerts', detail: 'Review and respond to alerts', to: '/alerts', icon: BellRing, hue: 'coral' },
  { key: 'reports', title: 'Reports & Insights', detail: 'Conservation reporting hub', to: '/reports', icon: Activity, hue: 'blue' },
];

function Dashboard() {
  const user = getCurrentUser();
  const [alerts, setAlerts] = useState([]);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let active = true;
    async function loadAlerts() {
      try {
        const { data } = await apiClient.get('/tracking/alerts');
        if (active) { setAlerts(Array.isArray(data?.alerts) ? data.alerts : []); setLoadState('ready'); }
      } catch {
        if (active) { setAlerts([]); setLoadState('error'); }
      }
    }
    loadAlerts();
    return () => { active = false; };
  }, []);

  const activeAlerts = useMemo(() => alerts.filter((alert) => !['RESOLVED', 'ESCALATED'].includes(String(alert.status || '').toUpperCase())), [alerts]);
  const priorityAlerts = useMemo(() => activeAlerts.filter((alert) => String(alert.priority || '').toUpperCase() === 'HIGH'), [activeAlerts]);
  const recentAlerts = useMemo(() => alerts.slice(0, 4), [alerts]);
  const actions = shortcuts.filter(({ key }) => canAccessPage(user?.role, key));
  const selectedShortcuts = actions.slice(0, 6);
  const firstName = user?.name?.split(' ')?.[0] || 'Team';
  const alertCount = loadState === 'ready' ? activeAlerts.length : '—';
  const highCount = loadState === 'ready' ? priorityAlerts.length : '—';
  const monitoredCount = loadState === 'ready' ? alerts.length : '—';

  return (
    <div className="ws-dashboard">
      <div className="ws-page-heading ws-fade-in">
        <div><div className="ws-eyebrow"><span className="ws-eyebrow-line" /> WILDLIFE PROTECTION NETWORK</div><h1>Command Center<span className="ws-heading-period">.</span></h1><p>Welcome back, {firstName}. Your conservation overview is here.</p></div>
        <div className="ws-date-chip"><Clock3 size={15}/>{new Intl.DateTimeFormat('en-LK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</div>
      </div>

      <section className="ws-hero ws-rise-in" aria-label="WildSentinel overview">
        <div className="ws-hero-noise"/><div className="ws-hero-orbit ws-hero-orbit-1"/><div className="ws-hero-orbit ws-hero-orbit-2"/>
        <div className="ws-hero-content">
          <div className="ws-hero-kicker"><span className="ws-signal-dot"/> THE CONSERVATION NETWORK</div>
          <h2>Safeguarding the wild.<br/><em>Empowering the field.</em></h2>
          <p>One unified space to monitor wildlife, coordinate patrols and respond to emerging risks.</p>
          <div className="ws-hero-buttons">
            {canAccessPage(user?.role, 'alerts') && <Link to="/alerts" className="ws-hero-primary">Review risk alerts <ArrowRight size={16}/></Link>}
            {canAccessPage(user?.role, 'patrols') && <Link to="/patrols" className="ws-hero-secondary">Explore patrols <ChevronRight size={17}/></Link>}
            {!canAccessPage(user?.role, 'alerts') && !canAccessPage(user?.role, 'patrols') && <Link to="/conflicts" className="ws-hero-primary">Open conflict reports <ArrowRight size={16}/></Link>}
          </div>
        </div>
        <div className="ws-hero-art" aria-hidden="true"><div className="ws-hero-art-back"/><div className="ws-hero-art-badge"><img src="/brand/wildsentinel-crest.webp" alt="" /></div><div className="ws-orbit-point ws-orbit-point-a"/><div className="ws-orbit-point ws-orbit-point-b"/></div>
        <span className="ws-hero-corner-label"><RadioTower size={14}/> FIELD INTELLIGENCE</span>
      </section>

      <div className="ws-section-line"><div><span className="ws-mini-eyebrow">01 / LIVE OVERVIEW</span><h2>Operational pulse</h2></div><span className="ws-section-context">Based on wildlife alert feed</span></div>
      <section className="ws-kpi-grid" aria-label="Risk alert overview">
        <div className="ws-kpi ws-kpi-emerald"><div className="ws-kpi-top"><span>Active alerts</span><span className="ws-kpi-icon"><BellRing size={19}/></span></div><strong>{alertCount}</strong><div className="ws-kpi-bottom"><span className="ws-kpi-indicator"/> Awaiting resolution</div></div>
        <div className="ws-kpi ws-kpi-amber"><div className="ws-kpi-top"><span>High priority</span><span className="ws-kpi-icon"><ShieldAlert size={19}/></span></div><strong>{highCount}</strong><div className="ws-kpi-bottom"><span className="ws-kpi-indicator"/> Requires attention</div></div>
        <div className="ws-kpi ws-kpi-blue"><div className="ws-kpi-top"><span>Alerts in feed</span><span className="ws-kpi-icon"><Radar size={19}/></span></div><strong>{monitoredCount}</strong><div className="ws-kpi-bottom"><span className="ws-kpi-indicator"/> All available statuses</div></div>
        <div className="ws-kpi ws-kpi-gold"><div className="ws-kpi-top"><span>Workspace access</span><span className="ws-kpi-icon"><ShieldCheck size={19}/></span></div><strong className="ws-kpi-label-value">Role-based</strong><div className="ws-kpi-bottom"><span className="ws-kpi-indicator"/> Permissions respected</div></div>
      </section>

      <div className="ws-dashboard-bottom">
        <section className="ws-actions-section">
          <div className="ws-section-line"><div><span className="ws-mini-eyebrow">02 / OPERATIONS</span><h2>Navigate your workspace</h2></div><span className="ws-section-context">Access tailored to your role</span></div>
          <div className="ws-action-grid">
            {selectedShortcuts.map(({ to, title, detail, icon: Icon, hue }, index) => <Link to={to} className={`ws-action ws-action-${hue}`} key={to} style={{ '--ws-stagger': `${index * 55}ms` }}><span className="ws-action-icon"><Icon size={22}/></span><span className="ws-action-copy"><strong>{title}</strong><small>{detail}</small></span><ArrowRight className="ws-action-arrow" size={18}/></Link>)}
          </div>
        </section>

        <section className="ws-feed-section" aria-label="Recent tracking alerts">
          <div className="ws-section-line"><div><span className="ws-mini-eyebrow">03 / FIELD SIGNALS</span><h2>Latest alerts</h2></div>{canAccessPage(user?.role, 'alerts') && <Link to="/alerts" className="ws-text-link">View all <ArrowRight size={14}/></Link>}</div>
          <div className="ws-feed-panel">
            <div className="ws-feed-panel-top"><div className="ws-feed-icon"><Radar size={19}/></div><span>Wildlife tracking feed</span><span className={`ws-feed-state ws-feed-state-${loadState}`}>{loadState === 'ready' ? 'Connected' : loadState === 'loading' ? 'Loading' : 'Unavailable'}</span></div>
            {recentAlerts.length ? <div className="ws-feed-list">{recentAlerts.map((alert, index) => <div className="ws-feed-row" key={alert.alertId || index}><span className="ws-feed-row-icon"><CircleAlert size={17}/></span><span className="ws-feed-row-copy"><strong>{alert.zone || 'Unspecified zone'}</strong><small>{alert.animalId ? `Animal ${alert.animalId}` : alert.alertId || 'Tracking event'}</small></span><span className="ws-feed-badge">{alert.status || 'NEW'}</span></div>)}</div> : <div className="ws-feed-empty"><div className="ws-feed-empty-icon">{loadState === 'error' ? <CircleAlert size={23}/> : <Shield size={23}/>}</div><strong>{loadState === 'loading' ? 'Loading latest activity…' : loadState === 'error' ? 'Alert feed unavailable' : 'No alerts in the feed'}</strong><p>{loadState === 'error' ? 'Check the API connection or try again later.' : 'Tracking alerts will appear here when available.'}</p></div>}
            <div className="ws-feed-panel-footer"><Fingerprint size={15}/> Showing live API data when available</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
