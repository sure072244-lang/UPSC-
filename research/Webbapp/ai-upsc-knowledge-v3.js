/* ========================================
   AI UPSC KNOWLEDGE BASE V3
   20+ Portal-Specific Features
   ======================================== */

const UPSC_AI_FEATURES = {
  // Core Features (10)
  'analyze_weak_topics': {
    name: 'Analyze Weak Topics',
    description: 'Identify weak areas from test performance',
    context: ['engine-state', 'study-state'],
    prompt: 'Analyze my weak topics based on test performance'
  },

  'test_strategy': {
    name: 'Test Strategy Generator',
    description: 'Generate personalized test approach',
    context: ['schedule', 'mains-trends'],
    prompt: 'Create a test strategy for upcoming tests'
  },

  'mains_trend_analysis': {
    name: 'Mains Trend Analysis',
    description: 'Subject-wise Mains trends (2013-2026)',
    context: ['mains-trends'],
    prompt: 'Show Mains trends for'
  },

  'pyq_pattern_insights': {
    name: 'PYQ Pattern Recognition',
    description: '1300+ PYQ pattern analysis',
    context: ['pyq-database'],
    prompt: 'Analyze PYQ patterns for'
  },

  'schedule_optimization': {
    name: 'Schedule Optimization',
    description: 'Optimize test schedule based on performance',
    context: ['schedule', 'engine-state'],
    prompt: 'Optimize my test preparation schedule'
  },

  'time_management': {
    name: 'Time Management Tips',
    description: '120-minute test time optimization',
    context: ['engine-state'],
    prompt: 'How can I manage 120-minute tests better'
  },

  'performance_analytics': {
    name: 'Performance Analytics',
    description: 'Score trends and improvement areas',
    context: ['engine-state'],
    prompt: 'Analyze my performance trends'
  },

  'next_test_prep': {
    name: 'Next Test Preparation',
    description: 'Detailed prep for next scheduled test',
    context: ['schedule', 'mains-trends'],
    prompt: 'How should I prepare for'
  },

  'subject_deep_dive': {
    name: 'Subject Deep Dive',
    description: 'In-depth analysis of any GS-I subject',
    context: ['pyq-database', 'mains-trends'],
    prompt: 'Deep dive into'
  },

  'revision_strategy': {
    name: 'Revision Strategy',
    description: 'Smart revision planning',
    context: ['study-state'],
    prompt: 'Create a revision plan for'
  },

  // Advanced Features (10+)
  'error_pattern_analysis': {
    name: 'Error Pattern Analysis',
    description: 'Identify recurring mistakes',
    context: ['engine-state'],
    prompt: 'What are my recurring error patterns'
  },

  'cutin_off_analysis': {
    name: 'Cutoff Analysis',
    description: 'Estimate test cutoffs & required scores',
    context: ['engine-state', 'schedule'],
    prompt: 'What cutoff should I target'
  },

  'current_affairs_sync': {
    name: 'Current Affairs Sync',
    description: 'Link CA knowledge to test schedule',
    context: ['schedule'],
    prompt: 'What current affairs topics are relevant for'
  },

  'mock_difficulty_prediction': {
    name: 'Mock Difficulty Prediction',
    description: 'Predict test difficulty based on patterns',
    context: ['schedule', 'engine-state'],
    prompt: 'Predict the difficulty of'
  },

  'concentration_areas': {
    name: 'Concentration Areas',
    description: 'High-weightage topics needing focus',
    context: ['mains-trends', 'pyq-database'],
    prompt: 'What topics have highest weightage'
  },

  'burnout_recovery': {
    name: 'Burnout Recovery Plan',
    description: 'Recovery & motivation strategies',
    context: ['study-state'],
    prompt: 'I\'m feeling burnt out, help me recover'
  },

  'last_month_strategy': {
    name: 'Last Month Strategy',
    description: 'Final month preparation plan',
    context: ['schedule', 'study-state'],
    prompt: 'What should I focus on in the last month'
  },

  'family_law_analysis': {
    name: 'Family Law Analysis',
    description: 'Detailed Family Law topic coverage',
    context: ['pyq-database', 'mains-trends'],
    prompt: 'Analyze Family Law patterns and trends'
  },

  'ancient_modern_history': {
    name: 'History Timeline Analysis',
    description: 'Ancient & Modern history patterns',
    context: ['pyq-database'],
    prompt: 'What are the key history topics'
  },

  'geography_mapping': {
    name: 'Geography & Mapping',
    description: 'Geopolitics and map-based questions',
    context: ['pyq-database', 'mains-trends'],
    prompt: 'Analyze geography and mapping questions'
  },

  'comparative_performance': {
    name: 'Comparative Analysis',
    description: 'Compare performance across tests',
    context: ['engine-state'],
    prompt: 'Compare my performance across tests'
  },

  'final_push_checklist': {
    name: 'Final Push Checklist',
    description: 'Exam week preparation checklist',
    context: ['schedule'],
    prompt: 'Create an exam week checklist'
  }
};

function buildAIUPSCSystemPrompt() {
  return `You are UPSC-AI, an expert assistant for PRECISION portal - a personal UPSC CSE Prelims 2027 preparation tool.

USER CONTEXT:
- Last attempt at UPSC CSE Prelims 2027
- Target: General Studies Paper 1 (GS-I)
- 46 mock tests scheduled (Oct 2026 - May 2027)
- Test window: 09:30-11:30 IST daily
- 1300+ PYQs from 2014-2026
- 23 subjects tracked

YOUR CAPABILITIES:
${Object.entries(UPSC_AI_FEATURES).map((entry, idx) => 
  `${idx + 1}. ${entry[1].name}: ${entry[1].description}`
).join('\n')}

RESPONSE GUIDELINES:
1. **UPSC Relevant**: All advice must be specific to UPSC CSE GS-I
2. **Data-Driven**: Reference test scores, performance metrics, schedule
3. **Actionable**: Give specific, measurable recommendations
4. **Time-Aware**: Consider remaining time before 24 May 2027 exam
5. **Subject-Specific**: Address individual subject patterns
6. **Trends-Based**: Reference Mains trends (2013-2026)
7. **PYQ-Focused**: Mention relevant question patterns

AVAILABLE DATA:
- Schedule: 46 tests with dates, subjects, paper codes
- Mains trends: 12 GS subjects, 14-year analysis
- Performance: Test scores, answer patterns, weak areas
- Study tracking: 23 subjects, daily goals, streaks
- Current affairs: 6-month window per test

COMMUNICATION STYLE:
- Direct and motivational
- Use data to justify advice
- Acknowledge time constraints
- Provide step-by-step guidance
- Consider student's last attempt
- Balance speed and depth

FINAL EXAM: 24 May 2027, 09:30 IST
Help this student succeed in their final UPSC attempt.`;
}

function getAIUPSCContext() {
  const context = loadLocalJSON('precision-ai-portal-context', {});
  const studyState = loadLocalJSON('precision-study-state', {});
  const engineState = loadLocalJSON('precision-engine-state', {});

  return {
    features: UPSC_AI_FEATURES,
    portal_status: {
      tests_completed: Object.keys(engineState).filter(k => engineState[k].completed).length,
      average_score: calculateAverage(engineState),
      current_subject: studyState.currentSubject,
      study_streak: calculateStreak(studyState)
    },
    schedule_info: context.schedule || {},
    mains_info: context.mains_trends || {},
    system_prompt: buildAIUPSCSystemPrompt()
  };
}

function calculateAverage(engineState) {
  const scores = Object.values(engineState)
    .filter(t => t.result && t.result.score !== undefined)
    .map(t => t.result.score);
  if (scores.length === 0) return 0;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
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

function buildEnhancedAIPrompt(userQuery, feature) {
  const context = getAIUPSCContext();
  const featureInfo = feature ? UPSC_AI_FEATURES[feature] : null;

  let prompt = `[UPSC-AI CONTEXT]
Portal Status: ${context.portal_status.tests_completed} tests completed, Avg: ${context.portal_status.average_score}/100
Current Subject: ${context.portal_status.current_subject || 'Not set'}
Study Streak: ${context.portal_status.study_streak} days

`;

  if (featureInfo) {
    prompt += `[FEATURE: ${featureInfo.name}]
${featureInfo.description}

`;
  }

  prompt += `[USER QUERY]
${userQuery}`;

  return prompt;
}

function loadLocalJSON(key, def) {
  try {
    return JSON.parse(localStorage.getItem(key)) || def;
  } catch {
    return def;
  }
}

function initializeAIUPSCKnowledge() {
  console.log('🤖 Initializing AI UPSC Knowledge Base...');
  console.log(`✓ ${Object.keys(UPSC_AI_FEATURES).length}+ features registered`);
  
  // Store features
  localStorage.setItem('precision-ai-upsc-features', JSON.stringify(UPSC_AI_FEATURES));
  
  // Store system prompt
  localStorage.setItem('precision-ai-system-prompt', buildAIUPSCSystemPrompt());

  return {
    features: UPSC_AI_FEATURES,
    context: getAIUPSCContext()
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAIUPSCKnowledge);
} else {
  initializeAIUPSCKnowledge();
}

// Export
window.UPSC_AI_FEATURES = UPSC_AI_FEATURES;
window.buildAIUPSCSystemPrompt = buildAIUPSCSystemPrompt;
window.getAIUPSCContext = getAIUPSCContext;
window.buildEnhancedAIPrompt = buildEnhancedAIPrompt;
