/* ========================================
   PRECISION PASSKEY SYSTEM V3 - HYBRID
   WebAuthn + Password Fallback
   ======================================== */

// ===== STORAGE =====
function loadLocalJSON(key, def) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : def;
  } catch (e) {
    return def;
  }
}

function saveLocalJSON(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    console.warn(`Storage error for ${key}:`, e);
  }
}

// ===== STATE =====
function deviceLockState() {
  return loadLocalJSON('precision-device-lock', {
    enabled: false,
    mode: null,
    credentialId: null,
    rpId: null,
    passwordHash: null,
    createdAt: null
  });
}

function saveDeviceLock(state) {
  saveLocalJSON('precision-device-lock', state);
}

// ===== BASE64URL ENCODING (WebAuthn) =====
function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

// ===== SIMPLE PASSWORD HASH =====
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return b64url(new Uint8Array(hash));
}

// ===== REGISTER DEVICE LOCK =====
async function registerDeviceLock() {
  // Try WebAuthn first
  if (window.PublicKeyCredential && navigator.credentials) {
    try {
      const av = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
      if (av !== false) {
        return await registerWebAuthnLock();
      }
    } catch (e) {
      console.log('WebAuthn unavailable, using password:', e.message);
    }
  }

  // Fallback: Password
  return await registerPasswordLock();
}

async function registerWebAuthnLock() {
  if (!window.isSecureContext) {
    return {
      ok: false,
      msg: 'WebAuthn requires HTTPS. Use the exact Vercel URL in Chrome with screen lock enabled.'
    };
  }

  const challenge = new Uint8Array(32);
  const uid = new Uint8Array(16);
  crypto.getRandomValues(challenge);
  crypto.getRandomValues(uid);

  const attempts = [
    {
      label: 'platform',
      selection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'required'
      }
    },
    {
      label: 'platform-relaxed',
      selection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required'
      }
    },
    {
      label: 'credential-manager',
      selection: {
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'required'
      }
    }
  ];

  let lastErr = null;

  for (const attempt of attempts) {
    try {
      const publicKey = {
        challenge,
        rp: {
          id: location.hostname,
          name: 'PRECISION UPSC Study Portal'
        },
        user: {
          id: uid,
          name: 'precision-device',
          displayName: 'PRECISION device'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: attempt.selection,
        timeout: 60000,
        attestation: 'none'
      };

      const cred = await navigator.credentials.create({ publicKey });

      if (!cred) {
        throw new Error('Passkey registration was cancelled.');
      }

      saveDeviceLock({
        enabled: true,
        mode: 'webauthn',
        credentialId: b64url(new Uint8Array(cred.rawId)),
        rpId: location.hostname,
        createdAt: Date.now(),
        passwordHash: null
      });

      return {
        ok: true,
        msg: '✓ WebAuthn passkey enabled. Unlock using this device\'s screen lock / biometric.'
      };
    } catch (e) {
      lastErr = e;
    }
  }

  const err = lastErr || {};
  let msg = err.message || 'WebAuthn setup failed.';

  if (err.name === 'NotAllowedError') {
    msg = 'Setup was cancelled or timed out. Ensure screen lock is enabled and you\'re on HTTPS.';
  }

  return { ok: false, msg, fallback: 'Try password' };
}

async function registerPasswordLock() {
  const password = prompt('Set a private portal password (never sent to server):\n\n⚠️ This is local-only. Write it down.');
  if (!password || password.length < 6) {
    return { ok: false, msg: 'Password must be 6+ characters.' };
  }

  const confirm = prompt('Confirm password:');
  if (confirm !== password) {
    return { ok: false, msg: 'Passwords do not match.' };
  }

  const hash = await hashPassword(password);
  saveDeviceLock({
    enabled: true,
    mode: 'password',
    passwordHash: hash,
    credentialId: null,
    rpId: null,
    createdAt: Date.now()
  });

  return {
    ok: true,
    msg: '✓ Password lock enabled. Enter password to unlock on next load.'
  };
}

// ===== AUTHENTICATE DEVICE LOCK =====
async function authenticateDeviceLock() {
  const saved = deviceLockState();

  if (!saved.enabled) {
    unlockPortalUI();
    return true;
  }

  if (saved.mode === 'webauthn') {
    return await authenticateWebAuthnLock(saved);
  } else if (saved.mode === 'password') {
    return await authenticatePasswordLock(saved);
  }

  // Fallback
  return await authenticatePasswordLock(saved);
}

async function authenticateWebAuthnLock(saved) {
  if (!window.isSecureContext || !window.PublicKeyCredential) {
    showLockError('WebAuthn requires HTTPS. Use the exact Vercel URL.');
    return false;
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  try {
    const publicKey = {
      challenge,
      rpId: saved.rpId || location.hostname,
      userVerification: 'required',
      timeout: 60000
    };

    if (saved.credentialId) {
      publicKey.allowCredentials = [
        {
          type: 'public-key',
          id: fromB64url(saved.credentialId)
        }
      ];
    }

    const cred = await navigator.credentials.get({ publicKey });

    if (!cred) {
      showLockError('Verification was cancelled.');
      return false;
    }

    unlockPortalUI();
    return true;
  } catch (e) {
    const name = e?.name || '';
    let msg = e?.message || 'Credential verification error.';

    if (name === 'NotAllowedError') {
      msg = 'Verification cancelled or timed out. Use this device\'s screen lock/biometric.';
    } else if (name === 'SecurityError') {
      msg = 'Security error. Ensure you\'re on the exact HTTPS URL used to register.';
    } else if (name === 'NotSupportedError') {
      msg = 'This browser/device cannot access the saved passkey.';
    }

    showLockError(msg);
    return false;
  }
}

async function authenticatePasswordLock(saved) {
  const password = prompt('Enter portal password:');
  if (!password) {
    showLockError('Password required.');
    return false;
  }

  const hash = await hashPassword(password);
  if (hash === saved.passwordHash) {
    unlockPortalUI();
    return true;
  } else {
    showLockError('Incorrect password.');
    return false;
  }
}

// ===== UI HELPERS =====
function lockPortal() {
  document.body.classList.add('portal-locked');
  const o = document.getElementById('deviceLockOverlay');
  if (o) o.hidden = false;
}

function unlockPortalUI() {
  document.body.classList.remove('portal-locked');
  const o = document.getElementById('deviceLockOverlay');
  if (o) o.hidden = true;
}

function showLockError(msg) {
  const el = document.getElementById('deviceLockError');
  if (el) {
    el.textContent = msg;
    el.hidden = false;
  }
}

function installDeviceLockUI() {
  if (!document?.getElementById || !document?.createElement || !document?.body) return;
  if (document.getElementById('deviceLockOverlay')) return;

  const o = document.createElement('div');
  o.id = 'deviceLockOverlay';
  o.hidden = true;
  o.innerHTML = `
    <div class="device-lock-card">
      <div class="lockicon">🔐</div>
      <div class="eyebrow">DEVICE PASSKEY</div>
      <h2>PRECISION is locked</h2>
      <p>Unlock with this device's biometric / screen lock (WebAuthn) or password.</p>
      <button class="btn primary" id="unlockDeviceBtn">Unlock PRECISION</button>
      <div id="deviceLockError" class="notice error" hidden style="margin-top:10px"></div>
      <div class="notice" style="margin-top:10px; background:rgba(55,214,255,0.08); border-color:rgba(55,214,255,0.2)">
        <strong>Passkey Info:</strong> If WebAuthn fails, a password prompt will appear. If passkey is lost, 
        <code>localStorage.removeItem('precision-device-lock')</code> in console and re-register.
      </div>
    </div>
  `;
  document.body.appendChild(o);

  o.querySelector('#unlockDeviceBtn').onclick = authenticateDeviceLock;

  if (deviceLockState().enabled) {
    setTimeout(lockPortal, 0);
  }
}

// ===== DISABLE/RESET PASSKEY =====
async function disableDeviceLock() {
  if (!confirm("Disable passkey? You'll need to re-register next time.")) return;
  saveDeviceLock({ enabled: false, mode: null, credentialId: null, rpId: null, passwordHash: null });
  alert('Passkey disabled.');
}
