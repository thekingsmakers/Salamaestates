/**
 * Salama Estates - Authentication & Password Protection System
 * Supports:
 * - Admin Panel Password Gate (SHA-256)
 * - Optional Site-Wide Password Lock (for private staging)
 * - Secure session management in sessionStorage / localStorage
 */

const SalamaAuth = (function () {
  'use strict';

  // Default password hash for "salama2026"
  const DEFAULT_HASH = '732f9678b838fba7561778d948d001d023916f0fde2b36d446a9df3321b61568';
  const STORAGE_KEY_HASH = 'salama_auth_hash';
  const STORAGE_KEY_ADMIN_SESSION = 'salama_admin_authenticated';
  const STORAGE_KEY_SITE_LOCK = 'salama_site_lock_enabled';
  const STORAGE_KEY_SITE_SESSION = 'salama_site_authenticated';

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getStoredHash() {
    return localStorage.getItem(STORAGE_KEY_HASH) || DEFAULT_HASH;
  }

  async function verifyPassword(password) {
    const hashed = await sha256(password);
    return hashed === getStoredHash();
  }

  function isAdminAuthenticated() {
    return sessionStorage.getItem(STORAGE_KEY_ADMIN_SESSION) === 'true';
  }

  function setAdminAuthenticated(status) {
    if (status) {
      sessionStorage.setItem(STORAGE_KEY_ADMIN_SESSION, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    }
  }

  async function changePassword(oldPassword, newPassword) {
    const isOldValid = await verifyPassword(oldPassword);
    if (!isOldValid) {
      throw new Error('Current password is incorrect.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    const newHash = await sha256(newPassword);
    localStorage.setItem(STORAGE_KEY_HASH, newHash);
    return true;
  }

  function isSiteLockEnabled() {
    return localStorage.getItem(STORAGE_KEY_SITE_LOCK) === 'true';
  }

  function setSiteLockEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY_SITE_LOCK, enabled ? 'true' : 'false');
  }

  function isSiteAuthenticated() {
    if (!isSiteLockEnabled()) return true;
    return sessionStorage.getItem(STORAGE_KEY_SITE_SESSION) === 'true';
  }

  function setSiteAuthenticated(status) {
    if (status) {
      sessionStorage.setItem(STORAGE_KEY_SITE_SESSION, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SITE_SESSION);
    }
  }

  // Enforce site lock if enabled
  function checkSiteLockGate() {
    if (isSiteLockEnabled() && !isSiteAuthenticated()) {
      renderSiteLockOverlay();
    }
  }

  function renderSiteLockOverlay() {
    if (document.getElementById('site-lock-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'site-lock-modal';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(22, 31, 34, 0.95); backdrop-filter: blur(8px);
      z-index: 999999; display: flex; align-items: center; justify-content: center;
      padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="background: #fff; width: 100%; max-width: 420px; border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); text-align: center;">
        <div style="width: 56px; height: 56px; background: #E0F3F5; color: #0E7D8B; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">
          🔒
        </div>
        <h2 style="font-size: 1.4rem; color: #161F22; margin-bottom: 8px;">Private Access Portal</h2>
        <p style="font-size: 0.9rem; color: #54676D; margin-bottom: 24px;">
          This Salama Estates public information site is currently in restricted preview. Please enter the access password to continue.
        </p>
        <form id="site-lock-form">
          <input type="password" id="site-lock-input" placeholder="Enter access password" style="width: 100%; padding: 12px 16px; border: 1px solid #CCD4D7; border-radius: 8px; font-size: 1rem; margin-bottom: 12px; box-sizing: border-box;" required autofocus>
          <div id="site-lock-error" style="color: #C62828; font-size: 0.85rem; margin-bottom: 12px; display: none;">Incorrect password. Please try again.</div>
          <button type="submit" style="width: 100%; background: #0E7D8B; color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
            Unlock Site &rarr;
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('site-lock-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = document.getElementById('site-lock-input').value;
      const valid = await verifyPassword(pwd);
      if (valid) {
        setSiteAuthenticated(true);
        overlay.remove();
      } else {
        document.getElementById('site-lock-error').style.display = 'block';
      }
    });
  }

  // Auto check on page load if site lock is on
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkSiteLockGate);
    } else {
      checkSiteLockGate();
    }
  }

  return {
    verifyPassword,
    isAdminAuthenticated,
    setAdminAuthenticated,
    changePassword,
    isSiteLockEnabled,
    setSiteLockEnabled,
    isSiteAuthenticated,
    setSiteAuthenticated,
    DEFAULT_HASH
  };
})();
