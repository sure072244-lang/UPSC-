/* ========================================
   AI CONTEXT BUILDER V3
   Schedule + Portal Data Integration
   ======================================== */

// ===== SCHEDULE DATA LOADER =====
let SCHEDULE_DATA = null;
let MAINS_TRENDS_DATA = null;
let PYQ_STATS = null;

async function loadScheduleData() {
  try {
    const response = await fetch('data/schedule_2027_v1.json');
    const data = await response.json();
    SCHEDULE_DATA = data.papers || [];
    console.log(`✓ Loaded ${SCHEDULE_DATA.length} tests from schedule`);
    return SCHEDULE_DATA;
  } catch (e) {
    console.warn('Schedule load failed:', e);
    SCHEDULE_DATA = [];
    return [];
  }
}

async function loadMainsTrendsData() {
  try {
    const response = await fetch('data/mains_gs_trend_2013_2026.json');
    const data = await response.json();
    MAINS_TRENDS_DATA = data || {};
    console.log(`✓ Loaded Mains trends for ${Object.keys(MAINS_TRENDS_DATA).length} subjects`);
    return MAINS_TRENDS_DATA;
  } catch (e) {
    console.warn('Mains trends load failed:', e);
    MAINS_TRENDS_DATA = {};
    return {};
  }
}

// ===== BUILD PORTAL CONTEXT FOR AI =====
async function buildPortalContextForAI() {
  // Load data
  await loadScheduleData();
  await loadMainsTrendsData();

  const state = loadLocalJSON('precision-engine-state', {});
  const studyState = loadLocalJSON('precision-study-state', {});

  // Build context object
  const context = {
    portal_name: 'PRECISION UPSC GS-I Preparation Portal',
    purpose: 'Personal PWA for UPSC Civil Services Prelims 2027 (GS-I)',
    last_attempt: true,
    target_exam: 'UPSC CSE Prelims 2027',
    
    schedule: {
      total_tests: SCHEDULE_DATA.length,
      test_period: 'Oct 2026 - May 2027',
      testing_window: '09:30-11:30 IST',
      tests_by_subject: categorizeTestsBySubject(SCHEDULE_DATA),
      upcoming_tests: getNextUpcomingTests(SCHEDULE_DATA, 3),
      all_tests: formatScheduleForAI(SCHEDULE_DATA)
    },

    mains_trends: {
      years_covered: '2013-2026',
      subjects: Object.keys(MAINS_TRENDS_DATA),
      analysis: MAINS_TRENDS_DATA
    },

    study_progress: {
      total_subjects: 23,
      current_focus: studyState.currentSubject || 'Not set',
      daily_goal_minutes: studyState.dailyGoalMinutes || 480,
      streak_days: calculateStreak(studyState),
      recent_subjects: getRecentSubjects(studyState, 5)
    },

    engine_status: {
      tests_attempted: Object.keys(state).filter(k => state[k].attempted).length,
      tests_completed: Object.keys(state).filter(k => state[k].completed).length,
      total_slots: 50,
      average_score: calculateAverageScore(state)
    },

    pyq_available: {
      total_questions: '1300+',
      source: 'UPSC Prelims 2014-2026',
      years_covered: '13 years',
      subjects_included: 'All GS-I topics'
    },

    features_available: [
      'StudyTracker (23 subjects, daily goals)',
      'Mock Tests (50 timed tests, 09:30-11:30 IST)',
      'OMR Workflow (bubble detection, answer keys)',
      'AI Assistant (Mistral Small)',
      'Mains Trends Analysis',
      'PYQ Database',
      'Passkey Protection',
      'Device-only access',
      'Study Command tracker intelligence (replaces retired 3D surface)'
    ],

    ai_commands_available: [
      'Analyze my weak topics',
      'Generate test strategy',
      'Mains trends for [subject]',
      'PYQ pattern for [topic]',
      'Schedule analysis',
      'Study plan review',
      'Performance insights',
      'Next test preparation',
      'Time management tips'
    ],

    user_preferences: {
      timezone: 'IST',
      language: 'English',
      test_duration: '120 minutes',
      marking_scheme: '+2 correct, -0.67 wrong, 0 unmarked'
    }
  };

  return context;
}

// ===== HELPER FUNCTIONS =====
function categorizeTestsBySubject(tests) {
  const bySubject = {};
  tests.forEach(t => {
    const subj = t['Core Subject'] || 'Unknown';
    if (!bySubject[subj]) bySubject[subj] = [];
    bySubject[subj].push({ testId: t['Test ID'], date: t.Date });
  });
  return bySubject;
}

function getNextUpcomingTests(tests, count) {
  const today = new Date();
  return tests
    .filter(t => new Date(t.Date) >= today)
    .sort((a, b) => new Date(a.Date) - new Date(b.Date))
    .slice(0, count)
    .map(t => ({
      testId: t['Test ID'],
      date: t.Date,
      subject: t['Core Subject'],
      paperCode: t['Paper Code']
    }));
}

function formatScheduleForAI(tests) {
  return tests.map((t, idx) => ({
    order: idx + 1,
    testId: t['Test ID'],
    date: t.Date,
    day: t.Day,
    month: t.Month,
    subject: t['Core Subject'],
    type: t.Type,
    paperCode: t['Paper Code'],
    directQuestions: t['Direct Q'],
    indirectQuestions: t['Indirect Q'],
    caFocus: t['CA Focus'],
    level: t.Level
  }));
}

function calculateStreak(studyState) {
  const sessions = studyState.sessions || [];
  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  let currentDate = new Date(today);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const hasSession = sessions.some(s => {
      const sessionDate = new Date(s.timestamp).toISOString().split('T')[0];
      return sessionDate === dateStr;
    });

    if (hasSession) {
      streak++;
    } else {
      break;
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

function getRecentSubjects(studyState, count) {
  const sessions = studyState.sessions || [];
  const subjects = {};

  sessions.forEach(s => {
    if (s.subject) {
      subjects[s.subject] = (subjects[s.subject] || 0) + s.duration;
    }
  });

  return Object.entries(subjects)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([subj, mins]) => ({ subject: subj, totalMinutes: Math.round(mins) }));
}

function calculateAverageScore(state) {
  const scores = Object.values(state)
    .filter(t => t.result && t.result.score !== undefined)
    .map(t => t.result.score);

  if (scores.length === 0) return 0;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
}

// ===== SYSTEM PROMPT BUILDER =====
function buildAISystemPrompt() {
  return `You are an AI assistant for PRECISION, a personal UPSC Civil Services Prelims 2027 preparation portal.

PORTAL CONTEXT:
- Student is on their LAST ATTEMPT at UPSC CSE Prelims 2027
- Focus: General Studies Paper 1 (GS-I)
- Test schedule: Oct 2026 - May 2027 (46 tests)
- Testing window: 09:30-11:30 IST daily
- 1300+ PYQs available from 2014-2026

YOUR RESPONSIBILITIES:
1. Analyze weak topics from test performance
2. Provide Mains trends context for each subject
3. Suggest study strategies based on schedule
4. Reference PYQ patterns and repeat concepts
5. Give time management tips for 120-minute tests
6. Personalize advice based on current progress

COMMUNICATION STYLE:
- Clear, direct, actionable advice
- Reference specific test data when available
- Acknowledge time constraints
- Motivational but realistic
- Use data from portal to support suggestions

AVAILABLE DATA:
- 46 scheduled mock tests with dates and subjects
- Mains trends (2013-2026) for 12 GS subjects
- 1300+ PYQs indexed by subject/topic
- Student's study sessions and time allocation
- Test performance scores and patterns

When answering:
1. Check schedule for next test
2. Consider Mains trends for the subject
3. Reference PYQ patterns if relevant
4. Provide specific, measurable recommendations
5. Always consider the time remaining before exam

Your goal: Help the student maximize score in this critical, final attempt.`;
}

// ===== INITIALIZE CONTEXT =====
async function initializeAIContext() {
  console.log('🔄 Initializing AI context...');
  
  const context = await buildPortalContextForAI();
  const systemPrompt = buildAISystemPrompt();

  // Store context for AI calls
  saveLocalJSON('precision-ai-portal-context', context);
  saveLocalJSON('precision-ai-system-prompt', systemPrompt);

  console.log('✓ AI context ready:');
  console.log(`  - ${context.schedule.total_tests} tests loaded`);
  console.log(`  - ${Object.keys(context.mains_trends.analysis).length} subjects with Mains data`);
  console.log(`  - ${context.features_available.length} features registered`);
  console.log(`  - ${context.ai_commands_available.length} AI commands available`);

  return { context, systemPrompt };
}

// ===== INJECT INTO AI REQUESTS =====
function getEnhancedAIPrompt(userQuery) {
  const context = loadLocalJSON('precision-ai-portal-context', {});
  
  // Add portal context to user query for better responses
  const enhancedPrompt = `
[PORTAL CONTEXT]
Next test: ${context.schedule.upcoming_tests?.[0]?.testId || 'TBD'}
Study streak: ${context.study_progress?.streak_days || 0} days
Average score: ${context.engine_status?.average_score || 'N/A'}/100
Current focus: ${context.study_progress?.current_focus || 'Not set'}

[USER QUERY]
${userQuery}
`;

  return enhancedPrompt;
}

// ===== EXPORT FUNCTIONS =====
window.buildPortalContextForAI = buildPortalContextForAI;
window.initializeAIContext = initializeAIContext;
window.getEnhancedAIPrompt = getEnhancedAIPrompt;
window.buildAISystemPrompt = buildAISystemPrompt;
