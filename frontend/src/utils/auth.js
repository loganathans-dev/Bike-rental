const ROLE_KEYS = {
  admin: { token: 'admin_auth_token', user: 'admin_auth_user' },
  customer: { token: 'auth_token', user: 'auth_user' },
  consultancy: { token: 'partner_auth_token', user: 'partner_auth_user' },
};

function readStoredUser(role) {
  const keys = ROLE_KEYS[role];
  if (!keys) return null;
  const raw = localStorage.getItem(keys.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Token sent with API calls — picks session by current route so roles do not overwrite each other. */
export function getTokenForApi() {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) {
    return localStorage.getItem(ROLE_KEYS.admin.token) || legacyAdminToken();
  }
  if (path.startsWith('/consultancy')) {
    return localStorage.getItem(ROLE_KEYS.consultancy.token);
  }
  return localStorage.getItem(ROLE_KEYS.customer.token);
}

function legacyAdminToken() {
  const legacyUser = getAuthUser();
  if (legacyUser?.role === 'admin') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function setAuth({ token, user }) {
  const keys = ROLE_KEYS[user.role];
  if (!keys) return;
  localStorage.setItem(keys.token, token);
  localStorage.setItem(keys.user, JSON.stringify(user));
  if (user.role === 'customer') {
    localStorage.setItem('customer_logged_in', 'true');
  }
  if (user.role === 'admin') {
    // Stop using shared keys so customer/partner login in another tab does not log admin out
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

export function clearAdminAuth() {
  localStorage.removeItem(ROLE_KEYS.admin.token);
  localStorage.removeItem(ROLE_KEYS.admin.user);
}

export function clearAuth() {
  for (const { token, user } of Object.values(ROLE_KEYS)) {
    localStorage.removeItem(token);
    localStorage.removeItem(user);
  }
  localStorage.removeItem('customer_logged_in');
}

export function getAuthUser(role) {
  if (role) return readStoredUser(role);

  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  const user = readStoredUser('customer');
  return Boolean(localStorage.getItem(ROLE_KEYS.customer.token) && user?.role === 'customer');
}

export function isAdminLoggedIn() {
  const user = readStoredUser('admin');
  if (localStorage.getItem(ROLE_KEYS.admin.token) && user?.role === 'admin') {
    return true;
  }
  const legacy = getAuthUser();
  return Boolean(localStorage.getItem('auth_token') && legacy?.role === 'admin');
}

export function isPartnerLoggedIn() {
  const user = readStoredUser('consultancy');
  return Boolean(localStorage.getItem(ROLE_KEYS.consultancy.token) && user?.role === 'consultancy');
}

export function logout() {
  clearAuth();
}
