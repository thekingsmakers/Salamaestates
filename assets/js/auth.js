/**
 * Salama Estates - Authentication & Password Protection System
 * Supports:
 * - Admin Panel Password Gate (SHA-256 with robust Pure-JS fallback)
 * - Safe on all protocols: file://, http://, https://, localhost
 * - Dual-validation (matches DEFAULT_HASH or localStorage hash, auto-syncing)
 * - Secure session management in sessionStorage / localStorage
 */

const SalamaAuth = (function () {
  'use strict';

  // Layer 1 Admin Master Password Hash ("G@ngstar36")
  const DEFAULT_HASH = '5470c8db55655bf4e75a31c2a5a0d3ff0188afd091e48c73e534d6284d77a2e5';

  // Layer 2 MFA Credentials Hashes
  // Username: "thekingsmakers"
  const MFA_USER_HASH = 'c9304b095360e458dc217e1a44bfd9484ebb11493377ffdb0854906db062176a';
  // Security PIN: "3609"
  const MFA_PIN_HASH = '66eba0f8578c53acb353d399405165153f066adaf9c6567bdd25b31fceb8a83e';

  // 5 Minutes Session Inactivity Timeout (300,000 ms)
  const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

  const STORAGE_KEY_HASH = 'salama_auth_hash';
  const STORAGE_KEY_ADMIN_SESSION = 'salama_admin_authenticated';
  const STORAGE_KEY_SESSION_TIME = 'salama_session_activity_time';
  const STORAGE_KEY_SITE_LOCK = 'salama_site_lock_enabled';
  const STORAGE_KEY_SITE_SESSION = 'salama_site_authenticated';

  /**
   * Pure JavaScript SHA-256 Implementation
   * Ensures SHA-256 works anywhere (including file:// protocol where crypto.subtle is disabled)
   */
  function pureSha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    let i, j, result = '';
    const words = [];
    let utf8 = '';
    try {
      utf8 = unescape(encodeURIComponent(ascii));
    } catch (e) {
      utf8 = ascii;
    }
    const asciiBitLength = utf8.length * 8;
    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let wordCount = 0;
    for (i = 0; i < utf8.length; i++) {
      words[wordCount >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (wordCount % 4) * 8);
      wordCount++;
    }
    words[wordCount >> 2] |= 0x80 << (24 - (wordCount % 4) * 8);
    words[(((wordCount + 8) >> 6) << 4) + 15] = asciiBitLength;

    const w = new Array(64);
    for (i = 0; i < words.length; i += 16) {
      let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
      let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

      for (j = 0; j < 64; j++) {
        if (j < 16) {
          w[j] = words[i + j] | 0;
        } else {
          const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
        }
        const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
        const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) | 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }
      hash[0] = (hash[0] + a) | 0;
      hash[1] = (hash[1] + b) | 0;
      hash[2] = (hash[2] + c) | 0;
      hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0;
      hash[5] = (hash[5] + f) | 0;
      hash[6] = (hash[6] + g) | 0;
      hash[7] = (hash[7] + h) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        result += ('0' + ((hash[i] >> (j * 8)) & 0xff).toString(16)).slice(-2);
      }
    }
    return result;
  }

  /**
   * Universal SHA-256 Digest
   */
  async function sha256(message) {
    if (typeof crypto !== 'undefined' && crypto && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (err) {
        // Fall back to pure JS
      }
    }
    return pureSha256(message);
  }

  const _memStore = {};
  function safeGet(key, preferSession) {
    try {
      if (preferSession && typeof sessionStorage !== 'undefined') {
        const val = sessionStorage.getItem(key);
        if (val !== null) return val;
      }
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {}
    return _memStore[key] || null;
  }

  function safeSet(key, val, toSession) {
    _memStore[key] = val;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
      }
    } catch (e) {}
    try {
      if (toSession && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, val);
      }
    } catch (e) {}
  }

  function safeRemove(key) {
    delete _memStore[key];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {}
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch (e) {}
  }

  function getStoredHash() {
    return safeGet(STORAGE_KEY_HASH) || DEFAULT_HASH;
  }

  function touchSessionActivity() {
    safeSet(STORAGE_KEY_SESSION_TIME, Date.now().toString(), true);
  }

  function getRemainingSessionTime() {
    const raw = safeGet(STORAGE_KEY_SESSION_TIME, true) || safeGet(STORAGE_KEY_SESSION_TIME);
    if (!raw) return 0;
    const lastActive = parseInt(raw, 10);
    if (isNaN(lastActive)) return 0;
    const elapsed = Date.now() - lastActive;
    return Math.max(0, SESSION_TIMEOUT_MS - elapsed);
  }

  function isSessionExpired() {
    return getRemainingSessionTime() <= 0;
  }

  let sessionIntervalId = null;
  const timeoutCallbacks = [];

  function onSessionTimeout(callback) {
    if (typeof callback === 'function') timeoutCallbacks.push(callback);
  }

  function triggerSessionTimeout() {
    setAdminAuthenticated(false);
    timeoutCallbacks.forEach(cb => {
      try { cb(); } catch (e) {}
    });
  }

  function startSessionTimer() {
    if (sessionIntervalId) clearInterval(sessionIntervalId);
    sessionIntervalId = setInterval(() => {
      const remaining = getRemainingSessionTime();
      const display = document.getElementById('session-countdown');
      if (display) {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        display.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }
      if (remaining <= 0) {
        clearInterval(sessionIntervalId);
        sessionIntervalId = null;
        triggerSessionTimeout();
      }
    }, 1000);
  }

  function stopSessionTimer() {
    if (sessionIntervalId) {
      clearInterval(sessionIntervalId);
      sessionIntervalId = null;
    }
  }

  let lastActivityTouch = 0;
  function initUserActivityTracking() {
    if (typeof window === 'undefined') return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => {
      window.addEventListener(evt, () => {
        const now = Date.now();
        if (now - lastActivityTouch > 2000) {
          lastActivityTouch = now;
          if (isAdminAuthenticated()) {
            touchSessionActivity();
          }
        }
      }, { passive: true });
    });
  }

  /**
   * Layer 1: Verify Master Admin Password
   */
  async function verifyLayer1(password) {
    if (typeof password !== 'string' || !password.length) return false;
    try {
      const clean = password.trim();

      // Direct match
      if (clean === 'G@ngstar36') {
        safeSet(STORAGE_KEY_HASH, DEFAULT_HASH);
        return true;
      }

      const hashClean = await sha256(clean);
      const hashRaw = await sha256(password);
      const storedHash = safeGet(STORAGE_KEY_HASH);

      const matchesDefault = (hashClean === DEFAULT_HASH || hashRaw === DEFAULT_HASH);
      const matchesStored = storedHash && (hashClean === storedHash || hashRaw === storedHash);

      if (matchesDefault || matchesStored) {
        if (matchesDefault && storedHash !== DEFAULT_HASH) {
          safeSet(STORAGE_KEY_HASH, DEFAULT_HASH);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Layer 1 verification error:', err);
      return password.trim() === 'G@ngstar36';
    }
  }

  /**
   * Layer 2: Verify Administrator MFA Username and Security PIN
   */
  async function verifyLayer2(username, pin) {
    if (!username || !pin) return false;
    try {
      const uClean = username.trim().toLowerCase();
      const pClean = pin.trim();

      const uHash = await sha256(uClean);
      const pHash = await sha256(pClean);

      const uValid = (uClean === 'thekingsmakers') || (uHash === MFA_USER_HASH);
      const pValid = (pClean === '3609') || (pHash === MFA_PIN_HASH);

      return uValid && pValid;
    } catch (err) {
      console.error('Layer 2 verification error:', err);
      return (username.trim().toLowerCase() === 'thekingsmakers') && (pin.trim() === '3609');
    }
  }

  async function verifyPassword(password) {
    return verifyLayer1(password);
  }

  function isAdminAuthenticated() {
    const isAuthed = (
      safeGet(STORAGE_KEY_ADMIN_SESSION, true) === 'true' ||
      safeGet(STORAGE_KEY_ADMIN_SESSION) === 'true'
    );
    if (!isAuthed) return false;
    if (isSessionExpired()) {
      setAdminAuthenticated(false);
      return false;
    }
    return true;
  }

  function setAdminAuthenticated(status) {
    if (status) {
      safeSet(STORAGE_KEY_ADMIN_SESSION, 'true', true);
      touchSessionActivity();
      startSessionTimer();
    } else {
      safeRemove(STORAGE_KEY_ADMIN_SESSION);
      safeRemove(STORAGE_KEY_SESSION_TIME);
      stopSessionTimer();
    }
  }

  async function changePassword(oldPassword, newPassword) {
    const isOldValid = await verifyPassword(oldPassword);
    if (!isOldValid) {
      throw new Error('Current password is incorrect.');
    }
    const cleanNew = (newPassword || '').trim();
    if (!cleanNew || cleanNew.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    const newHash = await sha256(cleanNew);
    safeSet(STORAGE_KEY_HASH, newHash);
    return true;
  }

  function resetToDefaultPassword() {
    safeRemove(STORAGE_KEY_HASH);
    safeRemove(STORAGE_KEY_ADMIN_SESSION);
    safeRemove(STORAGE_KEY_SITE_SESSION);
    return true;
  }

  function isSiteLockEnabled() {
    return safeGet(STORAGE_KEY_SITE_LOCK) === 'true';
  }

  function setSiteLockEnabled(enabled) {
    safeSet(STORAGE_KEY_SITE_LOCK, enabled ? 'true' : 'false');
  }

  function isSiteAuthenticated() {
    if (!isSiteLockEnabled()) return true;
    return safeGet(STORAGE_KEY_SITE_SESSION, true) === 'true' || safeGet(STORAGE_KEY_SITE_SESSION) === 'true';
  }

  function setSiteAuthenticated(status) {
    if (status) {
      safeSet(STORAGE_KEY_SITE_SESSION, 'true', true);
    } else {
      safeRemove(STORAGE_KEY_SITE_SESSION);
    }
  }

  // Enforce site lock if enabled
  function checkSiteLockGate() {
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('admin')) {
      return; // Never show site lock overlay on admin.html
    }
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
        <div style="width: 56px; height: 56px; background: #E0F3F5; color: #0E7D8B; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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

  /**
   * Geolocation Geo-Fence: Verify Visitor is strictly from Qatar (QA)
   * Queries multiple reliable IP geolocation providers with fast timeout.
   */
  async function checkQatarGeoAccess() {
    const endpoints = [
      {
        url: 'https://api.country.is/',
        parse: data => ({ code: (data.country || '').toUpperCase(), ip: data.ip || '', country: data.country === 'QA' ? 'Qatar' : (data.country || 'Unknown') })
      },
      {
        url: 'https://ipwho.is/',
        parse: data => ({ code: (data.country_code || '').toUpperCase(), ip: data.ip || '', country: data.country || (data.country_code === 'QA' ? 'Qatar' : 'Unknown') })
      }
    ];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const resp = await fetch(ep.url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timer);
        if (resp.ok) {
          const json = await resp.json();
          const info = ep.parse(json);
          if (info.code) {
            const isQatar = (info.code === 'QA');
            return {
              allowed: isQatar,
              countryCode: info.code,
              country: info.country || info.code,
              ip: info.ip || 'Unknown',
              status: isQatar ? 'verified' : 'denied'
            };
          }
        }
      } catch (err) {
        // Fallback to next provider
      }
    }

    // Fallback if network blocked or offline in local dev
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.protocol === 'file:'
    );

    return {
      allowed: isLocal,
      countryCode: isLocal ? 'LOCAL' : 'UNKNOWN',
      country: isLocal ? 'Local Workspace (Offline)' : 'Unknown',
      ip: '127.0.0.1',
      status: isLocal ? 'local' : 'offline'
    };
  }

  // Auto check on page load if site lock is on and initialize activity tracker
  if (typeof document !== 'undefined') {
    initUserActivityTracking();
    if (isAdminAuthenticated()) {
      startSessionTimer();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkSiteLockGate);
    } else {
      checkSiteLockGate();
    }
  }

  return {
    verifyPassword,
    verifyLayer1,
    verifyLayer2,
    isAdminAuthenticated,
    setAdminAuthenticated,
    touchSessionActivity,
    getRemainingSessionTime,
    isSessionExpired,
    onSessionTimeout,
    startSessionTimer,
    stopSessionTimer,
    changePassword,
    resetToDefaultPassword,
    isSiteLockEnabled,
    setSiteLockEnabled,
    isSiteAuthenticated,
    setSiteAuthenticated,
    checkQatarGeoAccess,
    DEFAULT_HASH,
    MFA_USER_HASH,
    MFA_PIN_HASH,
    SESSION_TIMEOUT_MS
  };
})();

if (typeof window !== 'undefined') {
  window.SalamaAuth = SalamaAuth;
}
