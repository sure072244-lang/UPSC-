/* ========================================
   UPSC COUNTDOWN V3 - MANDATORY
   Real-time countdown to 24 May 2027
   UPSC Civil Services Prelims
   ======================================== */

// UPSC Prelims: 24 May 2027, 09:30 IST
const UPSC_PRELIMS_DATE = new Date('2027-05-24T09:30:00+05:30');

function getUPSCCountdown() {
  const now = new Date();
  const diff = UPSC_PRELIMS_DATE - now;

  if (diff <= 0) {
    return {
      expired: true,
      message: '✓ UPSC Prelims 2027 completed'
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    percentage: Math.max(0, Math.min(100, (
      (7 * 30 - days) / (7 * 30) * 100
    ))),
    formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    displayText: days > 30 ? `${Math.ceil(days / 7)} weeks` : `${days} days`,
    milestone: getUpscMilestone(days)
  };
}

function getUpscMilestone(days) {
  if (days > 180) return { phase: 'Foundation', intensity: 'Low' };
  if (days > 90) return { phase: 'Consolidation', intensity: 'Medium' };
  if (days > 30) return { phase: 'Revision', intensity: 'High' };
  if (days > 7) return { phase: 'Final Push', intensity: 'Very High' };
  if (days > 0) return { phase: 'Exam Week', intensity: 'Critical' };
  return { phase: 'Completed', intensity: 'Done' };
}

function createUPSCCountdownWidget() {
  const widget = document.createElement('div');
  widget.id = 'upscCountdownWidget';
  widget.className = 'upsc-countdown-widget';
  widget.innerHTML = `
    <div class="upsc-countdown-card">
      <div class="upsc-header">
        <div class="upsc-title">UPSC PRELIMS 2027</div>
        <div class="upsc-date">24 MAY • 09:30 IST</div>
      </div>
      <div class="countdown-display">
        <div class="countdown-grid">
          <div class="countdown-unit">
            <div class="countdown-value" id="daysValue">0</div>
            <div class="countdown-label">DAYS</div>
          </div>
          <div class="countdown-unit">
            <div class="countdown-value" id="hoursValue">0</div>
            <div class="countdown-label">HOURS</div>
          </div>
          <div class="countdown-unit">
            <div class="countdown-value" id="minutesValue">0</div>
            <div class="countdown-label">MINS</div>
          </div>
          <div class="countdown-unit">
            <div class="countdown-value" id="secondsValue">0</div>
            <div class="countdown-label">SECS</div>
          </div>
        </div>
        <div class="countdown-bar">
          <div class="countdown-progress" id="countdownProgress" style="width: 0%"></div>
        </div>
        <div class="milestone-info">
          <div class="milestone-phase" id="milestonePhase">Foundation</div>
          <div class="milestone-intensity" id="milestoneIntensity">Low</div>
        </div>
      </div>
    </div>
  `;

  const styles = document.createElement('style');
  styles.textContent = `
    #upscCountdownWidget {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 120;
      max-width: 380px;
      pointer-events: auto;
    }

    .upsc-countdown-card {
      background: linear-gradient(135deg,
        rgba(42, 20, 100, 0.85),
        rgba(28, 64, 148, 0.75));
      border: 1px solid rgba(127, 167, 255, 0.35);
      border-radius: 14px;
      padding: 16px;
      backdrop-filter: blur(18px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .upsc-header {
      text-align: center;
      margin-bottom: 14px;
    }

    .upsc-title {
      font: 700 12px 'JetBrains Mono';
      color: #7fa7ff;
      letter-spacing: 0.12em;
      margin-bottom: 3px;
    }

    .upsc-date {
      font: 500 10px 'JetBrains Mono';
      color: #a8c5ff;
    }

    .countdown-display {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .countdown-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .countdown-unit {
      text-align: center;
      padding: 10px 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      border: 1px solid rgba(127, 167, 255, 0.2);
    }

    .countdown-value {
      font: 700 20px 'JetBrains Mono';
      color: #7fe8ff;
      line-height: 1;
      margin-bottom: 4px;
    }

    .countdown-label {
      font: 700 7px 'JetBrains Mono';
      color: #7fa0cc;
      letter-spacing: 0.08em;
    }

    .countdown-bar {
      height: 4px;
      background: rgba(127, 167, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .countdown-progress {
      height: 100%;
      background: linear-gradient(90deg, #3d8cff, #37d6ff);
      transition: width 0.3s ease;
    }

    .milestone-info {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    }

    .milestone-phase {
      font: 700 9px 'JetBrains Mono';
      color: #a8c5ff;
      flex: 1;
    }

    .milestone-intensity {
      font: 700 9px 'JetBrains Mono';
      color: #7fe8ff;
      text-align: right;
    }

    @media (max-width: 768px) {
      #upscCountdownWidget {
        top: auto;
        bottom: 80px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `;

  styles.id = 'precision-upsc-countdown-styles';
  if (!document.getElementById(styles.id)) document.head.appendChild(styles);
  return widget;
}

function updateUPSCCountdown() {
  const countdown = getUPSCCountdown();

  if (countdown.expired) {
    const widget = document.getElementById('upscCountdownWidget');
    if (widget) {
      widget.querySelector('.upsc-countdown-card').innerHTML = `
        <div class="upsc-header" style="color: #42e6a4;">
          <div class="upsc-title">UPSC PRELIMS 2027</div>
          <div class="upsc-date">✓ COMPLETED</div>
        </div>
      `;
    }
    return;
  }

  // Update values
  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value).padStart(2, '0');
  };

  setValue('daysValue', countdown.days);
  setValue('hoursValue', countdown.hours);
  setValue('minutesValue', countdown.minutes);
  setValue('secondsValue', countdown.seconds);

  // Update progress bar
  const progress = document.getElementById('countdownProgress');
  if (progress) progress.style.width = countdown.percentage + '%';

  // Update milestone
  const phaseEl = document.getElementById('milestonePhase');
  const intensityEl = document.getElementById('milestoneIntensity');
  if (phaseEl) phaseEl.textContent = countdown.milestone.phase;
  if (intensityEl) intensityEl.textContent = countdown.milestone.intensity;
}

function initializeUPSCCountdown() {
  if (window.__PRECISION_UPSC_COUNTDOWN_INSTANCE) {
    updateUPSCCountdown();
    return window.__PRECISION_UPSC_COUNTDOWN_INSTANCE;
  }
  console.log('⏰ MANDATORY: Initializing UPSC Countdown to 24 May 2027...');
  const existing = document.getElementById('upscCountdownWidget');
  const widget = existing || createUPSCCountdownWidget();
  if (!existing) document.body.appendChild(widget);
  updateUPSCCountdown();
  window.__PRECISION_UPSC_COUNTDOWN_INSTANCE = widget;
  window.__PRECISION_UPSC_COUNTDOWN_INTERVAL = window.setInterval(updateUPSCCountdown, 1000);
  console.log('✓ UPSC Countdown active: singleton instance; real-time updates to 24 May 2027 09:30 IST');
  return widget;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUPSCCountdown);
} else {
  initializeUPSCCountdown();
}

// Export
window.getUPSCCountdown = getUPSCCountdown;
window.UPSC_PRELIMS_DATE = UPSC_PRELIMS_DATE;
