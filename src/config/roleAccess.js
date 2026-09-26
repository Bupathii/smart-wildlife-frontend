// Which pages each role is allowed to see, based on the project's role responsibilities.
// ADMIN and MANAGER get the full operational set; RESEARCHER is analysis/view-only;
// RANGER's real workspace is the mobile app, so the web dashboard is intentionally minimal for them.
export const ROLE_PAGES = {
  ADMIN: [
    'dashboard',
    'rangers',
    'patrols',
    'patrol-routes',
    'incidents',
    'animals',
    'risk-zones',
    'alerts',
    'reports',
    'settings',
  ],
  MANAGER: [
    'dashboard',
    'rangers',
    'patrols',
    'patrol-routes',
    'incidents',
    'animals',
    'risk-zones',
    'alerts',
    'reports',
    'settings',
  ],
  RESEARCHER: ['dashboard', 'incidents', 'animals', 'reports', 'settings'],
  RANGER: ['dashboard', 'settings'],
};

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function canAccessPage(role, pageKey) {
  return (ROLE_PAGES[role] || []).includes(pageKey);
}
