/* ========================================
   REAL-TIME SYNC V3
   All portal components synchronized
   ======================================== */

const SYNC_CONFIG = {
  updateInterval: 5000, // Every 5 seconds
  syncKeys: [
    'precision-study-state',
    'precision-engine-state',
    'precision-evaluation-state',
    'precision-device-lock-v3',
    'precision-ai-portal-context',
    'precision-schedule-cache',
    'precision-secure-gate-v4',
    'precision-v874-feature-state'
  ]
};

class RealtimeSyncManager {
  constructor() {
    this.lastSync = {};
    this.syncListeners = {};
    this.initialized = false;
    this.channel = null;
  }

  init() {
    console.log('🔄 Initializing Real-time Sync Manager...');

    // Initialize hashes
    SYNC_CONFIG.syncKeys.forEach(key => {
      this.lastSync[key] = this.hashValue(localStorage.getItem(key));
    });

    // Listen for storage changes
    window.addEventListener('storage', (e) => this.handleStorageChange(e));
    // BroadcastChannel gives same-origin tabs immediate sync without waiting for the 5s polling heartbeat.
    try {
      this.channel = new BroadcastChannel('precision-realtime-v4');
      this.channel.onmessage = (e) => { const d=e?.data; if(d?.key && SYNC_CONFIG.syncKeys.includes(d.key)) this.notifyListeners(d.key,d.value); };
    } catch(e) { this.channel = null; }

    // Broadcast local changes
    setInterval(() => this.broadcastLocalChanges(), SYNC_CONFIG.updateInterval);

    // Sync with service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_INIT',
        keys: SYNC_CONFIG.syncKeys
      });
    }

    this.initialized = true;
    console.log('✓ Real-time Sync active');
  }

  hashValue(value) {
    if (!value) return 'null';
    return value.substring(0, 16) + '-' + value.length;
  }

  broadcastLocalChanges() {
    SYNC_CONFIG.syncKeys.forEach(key => {
      const current = localStorage.getItem(key);
      const currentHash = this.hashValue(current);

      if (currentHash !== this.lastSync[key]) {
        this.lastSync[key] = currentHash;
        this.notifyListeners(key, current);
        try { this.channel?.postMessage({key,value:current,at:Date.now()}); } catch(e) {}
      }
    });
  }

  registerListener(key, callback) {
    if (!this.syncListeners[key]) {
      this.syncListeners[key] = [];
    }
    this.syncListeners[key].push(callback);
  }

  notifyListeners(key, value) {
    if (this.syncListeners[key]) {
      this.syncListeners[key].forEach(cb => {
        try {
          cb(value);
        } catch (e) {
          console.warn(`Sync listener error for ${key}:`, e);
        }
      });
    }
  }

  handleStorageChange(e) {
    if (e.key && SYNC_CONFIG.syncKeys.includes(e.key)) {
      this.notifyListeners(e.key, e.newValue);
    }
  }

  // Sync specific components
  syncStudyState(callback) {
    this.registerListener('precision-study-state', callback);
  }

  syncEngineState(callback) {
    this.registerListener('precision-engine-state', callback);
  }

  syncEvaluationState(callback) {
    this.registerListener('precision-evaluation-state', callback);
  }

  syncAIContext(callback) {
    this.registerListener('precision-ai-portal-context', callback);
  }

  // Force sync
  async forceSync() {
    console.log('🔄 Forcing sync...');
    SYNC_CONFIG.syncKeys.forEach(key => {
      const value = localStorage.getItem(key);
      this.notifyListeners(key, value);
    });
  }
}

// Global instance
window.realtimeSyncManager = new RealtimeSyncManager();

// Auto-init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.realtimeSyncManager.init();
  });
} else {
  window.realtimeSyncManager.init();
}

// Update UI in real-time
function setupRealtimeUIUpdates() {
  // Countdown updates
  setInterval(() => {
    if (window.updateUPSCCountdown) {
      window.updateUPSCCountdown();
    }
  }, 1000);

  // Schedule status updates
  setInterval(() => {
    const status = document.getElementById('scheduleGateStatus');
    if (status && window.getCountdownToNextTest) {
      const next = window.getCountdownToNextTest();
      if (next) {
        status.textContent = `Next: ${next.testId} in ${next.daysRemaining}d`;
      }
    }
  }, 30000);

  // Study session tracking
  realtimeSyncManager.syncStudyState((newValue) => {
    console.log('📚 Study state updated');
    if (window.updateStudyDisplay) {
      window.updateStudyDisplay();
    }
  });

  // Engine state changes
  realtimeSyncManager.syncEngineState((newValue) => {
    console.log('⚙️ Engine state updated');
    if (window.updateEngineDisplay) {
      window.updateEngineDisplay();
    }
  });

  // AI context changes
  realtimeSyncManager.syncAIContext((newValue) => {
    console.log('🤖 AI context updated');
    if (window.updateAIDisplay) {
      window.updateAIDisplay();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupRealtimeUIUpdates);
} else {
  setupRealtimeUIUpdates();
}

// Export
window.setupRealtimeUIUpdates = setupRealtimeUIUpdates;
