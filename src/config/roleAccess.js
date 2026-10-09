export const WEB_ROLES = [
  'ADMIN',
  'PARK_MANAGER',
  'RANGER_SUPERVISOR',
  'RESEARCHER',
  'COMMUNITY_LIAISON_OFFICER',
];

export const MOBILE_ONLY_ROLES = [
  'RANGER',
  'COMMUNITY_MEMBER',
];

export const ROLE_PAGES = {
  ADMIN: [
    'dashboard',
    'rangers',
    'patrols',
    'patrol-routes',
    'incidents',
    'conflicts',

    /*
     * ADMIN ONLY
     */
    'conflict-archive',

    'animals',
    'risk-zones',
    'alerts',
    'camera-traps',
    'reports',
    'users',
    'settings',
  ],

  PARK_MANAGER: [
    'dashboard',
    'rangers',
    'patrols',
    'patrol-routes',
    'incidents',
    'conflicts',
    'animals',
    'risk-zones',
    'alerts',
    'camera-traps',
    'reports',
    'settings',
  ],

  RANGER_SUPERVISOR: [
    'dashboard',
    'rangers',
    'patrols',
    'patrol-routes',
    'incidents',
    'conflicts',
    'alerts',
    'reports',
  ],

  RESEARCHER: [
    'dashboard',
    'incidents',
    'conflicts',
    'animals',
    'camera-traps',
    'reports',
  ],

  COMMUNITY_LIAISON_OFFICER: [
    'dashboard',
    'conflicts',
    'alerts',
  ],

  RANGER: [],

  COMMUNITY_MEMBER: [],
};

export function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'user'
      ) || 'null'
    );
  } catch {
    return null;
  }
}

export function canAccessPage(
  role,
  pageKey
) {
  return (
    ROLE_PAGES[
      role
    ] || []
  ).includes(
    pageKey
  );
}

export function isWebRole(
  role
) {
  return WEB_ROLES.includes(
    role
  );
}

export function isMobileOnlyRole(
  role
) {
  return MOBILE_ONLY_ROLES.includes(
    role
  );
}