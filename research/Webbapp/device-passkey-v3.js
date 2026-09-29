/* ========================================
   DEVICE PASSKEY V3
   "This Device Only" - Hardware binding
   ======================================== */

// Generate device fingerprint
async function generateDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency,
    navigator.deviceMemory,
    new Date().getTimezoneOffset(),
    navigator.maxTouchPoints,
    window.screen.width + 'x' + window.screen.height
  ];

  const combined = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hash = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 32);
}

// Device fingerprint storage
async function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('precision-device-id');
  
  if (!deviceId) {
    deviceId = await generateDeviceFingerprint();
    localStorage.setItem('precision-device-id', deviceId);
    console.log('🔐 New device ID generated:', deviceId.substring(0, 8) + '...');
  }

  return deviceId;
}

// Register device-only passkey
async function registerDeviceOnlyPasskey() {
  const deviceId = await getOrCreateDeviceId();

  // Create a password prompt for local storage
  const password = prompt('Create a private portal password (6+ characters):\n\n⚠️ This password is stored locally on THIS DEVICE ONLY.\nNever saved to any server.');
  if (!password || password.length < 6) {
    return { ok: false, msg: 'Password must be at least 6 characters' };
  }

  const confirm = prompt('Confirm password:');
  if (confirm !== password) {
    return { ok: false, msg: 'Passwords do not match' };
  }

  // Hash password
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Try WebAuthn first (if available on this device)
  let webauthnId = null;
  try {
    if (window.PublicKeyCredential && navigator.credentials && window.isSecureContext) {
      const av = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
      if (av) {
        webauthnId = await setupWebAuthnForDevice(deviceId);
      }
    }
  } catch (e) {
    console.log('WebAuthn not available on this device');
  }

  // Store device lock
  saveLocalJSON('precision-device-lock-v3', {
    enabled: true,
    mode: webauthnId ? 'hybrid' : 'password',
    deviceId: deviceId,
    passwordHash: hashHex,
    webauthnId: webauthnId,
    createdAt: Date.now(),
    createdDate: new Date().toISOString(),
    deviceFingerprintHash: await generateDeviceFingerprint()
  });

  const mode = webauthnId ? 'WebAuthn + Password' : 'Password';
  return {
    ok: true,
    msg: `✓ Device lock registered (${mode}). This device is now identified.`,
    mode: mode,
    deviceId: deviceId.substring(0, 8)
  };
}

async function setupWebAuthnForDevice(deviceId) {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const publicKey = {
    challenge,
    rp: {
      id: location.hostname,
      name: 'PRECISION'
    },
    user: {
      id: new Uint8Array(16),
      name: `precision-device-${deviceId.substring(0, 8)}`,
      displayName: 'This Device'
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 }
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred'
    },
    timeout: 30000
  };

  try {
    const cred = await navigator.credentials.create({ publicKey });
    if (cred) {
      return btoa(String.fromCharCode(...new Uint8Array(cred.rawId)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }
  } catch (e) {
    console.log('WebAuthn setup failed:', e.message);
  }

  return null;
}

// Authenticate on same device
async function authenticateDeviceOnly() {
  const saved = loadLocalJSON('precision-device-lock-v3', null);
  if (!saved) return false;

  // Verify device fingerprint
  const currentFingerprint = await generateDeviceFingerprint();
  if (currentFingerprint !== saved.deviceFingerprintHash) {
    showDeviceLockError('This device fingerprint does not match. Cannot unlock on a different device.');
    return false;
  }

  // Try password auth
  const password = prompt('Enter your portal password:');
  if (!password) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (hashHex !== saved.passwordHash) {
    showDeviceLockError('Incorrect password');
    return false;
  }

  // If hybrid mode, try WebAuthn
  if (saved.mode === 'hybrid' && saved.webauthnId) {
    try {
      const authenticated = await authenticateWebAuthnSameDevice(saved);
      if (!authenticated) {
        // Fall back to password which already matched
        return true;
      }
    } catch (e) {
      console.log('WebAuthn failed, using password auth:', e.message);
    }
  }

  unlockDeviceUI();
  return true;
}

async function authenticateWebAuthnSameDevice(saved) {
  if (!window.PublicKeyCredential || !navigator.credentials) return false;

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  try {
    const publicKey = {
      challenge,
      rpId: location.hostname,
      userVerification: 'preferred',
      timeout: 30000,
      allowCredentials: [
        {
          type: 'public-key',
          id: Uint8Array.from(atob(saved.webauthnId).split('').map(c => c.charCodeAt(0)))
        }
      ]
    };

    const cred = await navigator.credentials.get({ publicKey });
    return !!cred;
  } catch (e) {
    return false;
  }
}

// UI helpers
function showDeviceLockError(msg) {
  const el = document.getElementById('deviceLockError');
  if (el) {
    el.textContent = msg;
    el.hidden = false;
  }
}

function unlockDeviceUI() {
  document.body.classList.remove('device-locked');
  const overlay = document.getElementById('deviceLockOverlay');
  if (overlay) overlay.hidden = true;
}

function lockDeviceUI() {
  document.body.classList.add('device-locked');
  const overlay = document.getElementById('deviceLockOverlay');
  if (overlay) overlay.hidden = false;
}

function installDevicePasskeyUI() {
  if (document.getElementById('deviceLockOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'deviceLockOverlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="device-lock-overlay">
      <div class="device-lock-card">
        <div class="lock-icon">🔐</div>
        <div class="lock-title">PRECISION • THIS DEVICE ONLY</div>
        <div class="lock-subtitle">Device ID: <code id="deviceIdDisplay">loading...</code></div>
        <p class="lock-description">This device is identified and locked. Enter your password to continue.</p>
        <input type="password" id="devicePassword" placeholder="Enter password" class="device-password-input" autocomplete="current-password">
        <button id="unlockButton" class="device-unlock-button">Unlock PRECISION</button>
        <div id="deviceLockError" class="device-lock-error" hidden></div>
        <div class="device-lock-info">
          <strong>ℹ️ Device Lock:</strong> Your password is stored only on this browser's local storage. 
          You must unlock on the same device. If you lose the password, 
          press F12, go to Console, and type: <code>localStorage.removeItem('precision-device-lock-v3')</code>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add styles
  const styles = document.createElement('style');
  styles.textContent = `
    .device-locked {
      filter: blur(5px);
      pointer-events: none;
    }

    #deviceLockOverlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .device-lock-overlay {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .device-lock-card {
      background: linear-gradient(135deg, #0b1527, #050d1a);
      border: 1px solid rgba(55,214,255,0.25);
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 30px 90px rgba(0,0,0,0.6);
      backdrop-filter: blur(20px);
    }

    .lock-icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 16px;
    }

    .lock-title {
      font: 700 14px 'JetBrains Mono';
      color: #7fa7ff;
      text-align: center;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }

    .lock-subtitle {
      font: 500 11px 'JetBrains Mono';
      color: #5a7ba8;
      text-align: center;
      margin-bottom: 16px;
    }

    .lock-subtitle code {
      background: rgba(55,214,255,0.1);
      padding: 2px 6px;
      border-radius: 4px;
      color: #37d6ff;
    }

    .lock-description {
      color: #8fa8c8;
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 20px;
      text-align: center;
    }

    .device-password-input {
      width: 100%;
      padding: 12px 14px;
      background: rgba(5,8,19,0.8);
      border: 1px solid rgba(55,214,255,0.2);
      border-radius: 10px;
      color: #e9eef9;
      font: 500 13px 'JetBrains Mono';
      margin-bottom: 12px;
    }

    .device-password-input::placeholder {
      color: #5a7ba8;
    }

    .device-password-input:focus {
      outline: none;
      border-color: rgba(55,214,255,0.5);
      box-shadow: 0 0 20px rgba(55,214,255,0.1);
    }

    .device-unlock-button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(90deg, #3d8cff, #37d6ff);
      border: none;
      border-radius: 10px;
      color: #fff;
      font: 700 12px 'JetBrains Mono';
      cursor: pointer;
      letter-spacing: 0.05em;
      transition: all 0.3s;
      margin-bottom: 16px;
    }

    .device-unlock-button:hover {
      box-shadow: 0 0 30px rgba(55,214,255,0.3);
    }

    .device-lock-error {
      background: rgba(255,80,110,0.15);
      border: 1px solid rgba(255,80,110,0.3);
      color: #ff8899;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 11px;
      margin-bottom: 12px;
      text-align: center;
    }

    .device-lock-info {
      background: rgba(55,214,255,0.08);
      border: 1px solid rgba(55,214,255,0.2);
      color: #a8c5ff;
      padding: 12px;
      border-radius: 8px;
      font-size: 11px;
      line-height: 1.6;
    }

    .device-lock-info code {
      background: rgba(0,0,0,0.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      color: #37d6ff;
    }
  `;
  document.head.appendChild(styles);

  // Set device ID display
  getOrCreateDeviceId().then(id => {
    const el = document.getElementById('deviceIdDisplay');
    if (el) el.textContent = id.substring(0, 8);
  });

  // Event listeners
  const passwordInput = document.getElementById('devicePassword');
  const unlockBtn = document.getElementById('unlockButton');

  unlockBtn.onclick = authenticateDeviceOnly;
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlockBtn.click();
  });

  // Check if locked
  const lockState = loadLocalJSON('precision-device-lock-v3', null);
  if (lockState && lockState.enabled) {
    lockDeviceUI();
  }
}

function loadLocalJSON(key, def) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : def;
  } catch {
    return def;
  }
}

function saveLocalJSON(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    installDevicePasskeyUI();
  });
} else {
  installDevicePasskeyUI();
}

// Export
window.registerDeviceOnlyPasskey = registerDeviceOnlyPasskey;
window.authenticateDeviceOnly = authenticateDeviceOnly;
window.getOrCreateDeviceId = getOrCreateDeviceId;
