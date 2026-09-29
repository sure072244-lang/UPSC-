/* ========================================
   SCHEDULE GATE V3
   - Tests only open on exact date/time
   - 09:30-11:30 IST window enforcement
   - Frozen outside window
   ======================================== */

let SCHEDULE_GATE_DATA = null;

async function loadScheduleGateData() {
  try {
    const res = await fetch('data/schedule_2027_v1.json');
    const data = await res.json();
    SCHEDULE_GATE_DATA = data.papers || [];
    console.log(`✓ Schedule Gate: ${SCHEDULE_GATE_DATA.length} tests loaded`);
    return SCHEDULE_GATE_DATA;
  } catch (e) {
    console.warn('Schedule load failed:', e);
    return [];
  }
}

// Get IST time
function getISTTime() {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return istTime;
}

function getScheduleWindow(test){
  const raw=String(test?.Timing||'09:30–11:30 IST').replace(/[–—]/g,'-');
  const m=raw.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  return m?{start:Number(m[1])*60+Number(m[2]),end:Number(m[3])*60+Number(m[4])}:{start:570,end:690};
}

// Check if test is within 09:30-11:30 IST window
function isTestWindowOpen(testDate, timing) {
  const ist = getISTTime();
  const istDateStr = ist.toISOString().split('T')[0];
  const testDateStr = new Date(testDate).toISOString().split('T')[0];

  if (istDateStr !== testDateStr) return false;

  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const win=getScheduleWindow({Timing:timing});
  const windowStart=win.start, windowEnd=win.end;

  return totalMinutes >= windowStart && totalMinutes <= windowEnd;
}

// Check test access
function getTestAccessStatus(testId) {
  if (!SCHEDULE_GATE_DATA) return { access: false, reason: 'Schedule not loaded' };

  const test = SCHEDULE_GATE_DATA.find(t => t['Test ID'] === testId);
  if (!test) return { access: false, reason: 'Test not found in schedule' };

  const now = getISTTime();
  const testDate = new Date(test.Date);
  const testDateIST = new Date(testDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  // Check if date has passed
  if (now < testDateIST) {
    const daysUntil = Math.ceil((testDateIST - now) / (1000 * 60 * 60 * 24));
    return {
      access: false,
      reason: `Test opens in ${daysUntil} day(s)`,
      daysUntil,
      scheduledDate: test.Date,
      paperCode: test['Paper Code']
    };
  }

  // Check window
  if (isTestWindowOpen(test.Date,test.Timing)) {
    const windowEnd = new Date(testDateIST);
    const win=getScheduleWindow(test); windowEnd.setHours(Math.floor(win.end/60),win.end%60,0,0);
    const timeRemaining = Math.floor((windowEnd - now) / 1000 / 60);
    
    return {
      access: true,
      reason: `OPEN: ${timeRemaining} minutes remaining`,
      timeRemaining,
      windowEnd: windowEnd.toISOString(),
      paperCode: test['Paper Code'],
      subject: test['Core Subject']
    };
  }

  // Check if today but outside window
  const istDateStr = now.toISOString().split('T')[0];
  const testDateStr = testDateIST.toISOString().split('T')[0];

  if (istDateStr === testDateStr) {
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const win=getScheduleWindow(test);
    if (hours*60+minutes < win.start) {
      const windowStartTime = new Date(testDateIST);
      windowStartTime.setHours(Math.floor(win.start/60),win.start%60,0,0);
      const timeUntilOpen = Math.floor((windowStartTime - now) / 1000 / 60);
      return {
        access: false,
        reason: `Test opens at ${String(Math.floor(win.start/60)).padStart(2,'0')}:${String(win.start%60).padStart(2,'0')} IST (${timeUntilOpen} min)`,
        timeUntilOpen,
        status: 'waiting'
      };
    } else {
      return {
        access: false,
        reason: 'Test window closed (11:30 IST has passed)',
        status: 'closed',
        nextTest: getNextTestId(testId)
      };
    }
  }

  // Test date has passed
  return {
    access: false,
    reason: 'Test date has passed',
    status: 'expired'
  };
}

function getNextTestId(currentTestId) {
  if (!SCHEDULE_GATE_DATA) return null;
  const idx = SCHEDULE_GATE_DATA.findIndex(t => t['Test ID'] === currentTestId);
  if (idx === -1 || idx === SCHEDULE_GATE_DATA.length - 1) return null;
  return SCHEDULE_GATE_DATA[idx + 1]['Test ID'];
}

// Check if can start test
function canStartTest(testId, paperCode) {
  const status = getTestAccessStatus(testId);
  
  if (!status.access) {
    return {
      allowed: false,
      message: status.reason
    };
  }

  // Verify paper code
  if (status.paperCode && paperCode !== status.paperCode) {
    return {
      allowed: false,
      message: `Wrong paper code. Expected: ${status.paperCode}`
    };
  }

  return {
    allowed: true,
    message: 'Test access granted',
    timeRemaining: status.timeRemaining,
    windowEnd: status.windowEnd
  };
}

// Get countdown to next test
function getCountdownToNextTest() {
  if (!SCHEDULE_GATE_DATA || SCHEDULE_GATE_DATA.length === 0) return null;

  const now = getISTTime();
  const upcoming = SCHEDULE_GATE_DATA.filter(t => new Date(t.Date) > now)[0];

  if (!upcoming) return null;

  const nextDate = new Date(upcoming.Date);
  const diff = nextDate - now;

  return {
    testId: upcoming['Test ID'],
    subject: upcoming['Core Subject'],
    date: upcoming.Date,
    daysRemaining: Math.ceil(diff / (1000 * 60 * 60 * 24)),
    hoursRemaining: Math.ceil(diff / (1000 * 60 * 60)),
    minutesRemaining: Math.ceil(diff / (1000 * 60))
  };
}

// Real-time schedule gate check
function startScheduleGateMonitor() {
  setInterval(() => {
    const display = document.getElementById('scheduleGateStatus');
    if (!display) return;

    const next = getCountdownToNextTest();
    if (!next) {
      display.textContent = '✓ All tests completed';
      display.classList.add('green');
      return;
    }

    if (next.daysRemaining <= 0) {
      display.textContent = `${next.testId} - ${next.hoursRemaining}h remaining`;
      display.classList.remove('green');
    } else {
      display.textContent = `Next: ${next.testId} in ${next.daysRemaining}d`;
    }
  }, 30000); // Update every 30 seconds
}

// Initialize on load
async function initializeScheduleGate() {
  console.log('🚪 Initializing Schedule Gate V3...');
  await loadScheduleGateData();
  startScheduleGateMonitor();
  console.log('✓ Schedule Gate active: Tests locked outside 09:30-11:30 IST');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeScheduleGate);
} else {
  initializeScheduleGate();
}

// Export functions
window.getTestAccessStatus = getTestAccessStatus;
window.canStartTest = canStartTest;
window.getCountdownToNextTest = getCountdownToNextTest;
window.getISTTime = getISTTime;
window.isTestWindowOpen = isTestWindowOpen;
