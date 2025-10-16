import { jwtDecode } from "jwt-decode";

// Token management
export function getUserToken() {
  return localStorage.getItem("access_token");
}

export function setTokens(accessToken) {
  localStorage.setItem("access_token", accessToken || "");
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
  
// User data management
export function setUserPayload(user = {}) {
  setTokens(user?.token);
  
  localStorage.setItem("user_payload", JSON.stringify(user));
  return user;
}

export function getUserPayload() {
  const userData = localStorage.getItem("user_payload");
  return userData ? JSON.parse(userData) : null;
}

export function resetUserPayload() {
  clearLocalStorage();
}

// Complete localStorage cleanup
export function clearLocalStorage() {
  localStorage.clear();
}
  
// Token validation
export function isTokenExpired() {
  const token = getUserToken();
  if (!token) return true;
  const { exp } = jwtDecode(token);
  return Date.now() >= parseInt(exp * 1000);
}
  
export function isAuthenticated() {
  const token = getUserToken();
  const user = getUserPayload();
  
  return !!(token && user && !isTokenExpired());
}
  
// Session management
export function getSessionInfo() {
  const user = getUserPayload();
  const isAuth = isAuthenticated();
  
  let timeUntilExpiry = null;
  const token = getUserToken();
  if (token) {
    try {
      const { exp } = jwtDecode(token);
      timeUntilExpiry = Math.max(0, parseInt(exp * 1000) - Date.now());
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }
  
  return {
    isAuthenticated: isAuth,
    user,
    timeUntilExpiry,
  };
}
  
// Local storage event listener for cross-tab synchronization
export function setupStorageListener() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'access_token' || e.key === 'user_payload') {
      // Token or user data changed in another tab
      if (!e.newValue) {
        // Token was removed, redirect to login
        window.location.href = '/login';
      }
    }
  });
}