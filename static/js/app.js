/**
 * Find Your Hydration Personality - Core Application Logic
 * Implements full quiz state machine, scoring, radar math, and share generation.
 */

(function () {
  'use strict';

  // Google Sheet Webhook Integration (persists all responses to Google Sheets)
  const GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby43hoDQMqM0XGcKiTNRqBBRLPx1dDdNZfuY-Mo-9gECwRAFNnibZRIOttyjAq_H0bqmA/exec';

  // Application State
  const state = {
    quizData: null,
    currentStep: 0, // 0: landing, 1-7: quiz questions, 8: loading, 9: result, 10: responses dashboard
    answers: {},
    unitMode: 'glasses', // 'glasses' or 'litres'
    userName: 'Friend',
    startTime: null,
    calculatedResult: null,
    totalResponsesCount: 0
  };

  // DOM Elements
  const els = {
    landingView: document.getElementById('landingView'),
    quizView: document.getElementById('quizView'),
    loadingView: document.getElementById('loadingView'),
    resultView: document.getElementById('resultView'),
    dashboardView: document.getElementById('dashboardView'),
    
    // Navbar
    btnResponsesNav: document.getElementById('btnResponsesNav'),
    badgeResponsesCount: document.getElementById('badgeResponsesCount'),
    btnToggleTheme: document.getElementById('btnToggleTheme'),
    themeIcon: document.getElementById('themeIcon'),
    brandHomeBtn: document.getElementById('brandHomeBtn'),
    
    // Landing
    userNameInput: document.getElementById('userNameInput'),
    startQuizBtn: document.getElementById('startQuizBtn'),
    landingMascot: document.getElementById('landingMascot'),
    
    // Quiz
    stepIndicator: document.getElementById('stepIndicator'),
    progressBarFill: document.getElementById('progressBarFill'),
    btnBack: document.getElementById('btnBack'),
    questionTitle: document.getElementById('questionTitle'),
    questionSubtitle: document.getElementById('questionSubtitle'),
    questionBody: document.getElementById('questionBody'),
    factCard: document.getElementById('factCard'),
    factText: document.getElementById('factText'),
    
    // Loading
    loadingStatus: document.getElementById('loadingStatus'),
    loadingProgressBar: document.getElementById('loadingProgressBar'),
    loadingMascot: document.getElementById('loadingMascot'),
    
    // Result
    resultMascot: document.getElementById('resultMascot'),
    resultForUser: document.getElementById('resultForUser'),
    resultEmoji: document.getElementById('resultEmoji'),
    resultName: document.getElementById('resultName'),
    resultVibe: document.getElementById('resultVibe'),
    resultDesc: document.getElementById('resultDesc'),
    radarContainer: document.getElementById('radarContainer'),
    superpowerBox: document.getElementById('superpowerBox'),
    growthBox: document.getElementById('growthBox'),
    tipText: document.getElementById('tipText'),
    twinText: document.getElementById('twinText'),
    btnRetake: document.getElementById('btnRetake'),
    btnShareCard: document.getElementById('btnShareCard'),
    btnCopyLink: document.getElementById('btnCopyLink'),
    btnViewCollectionFromResult: document.getElementById('btnViewCollectionFromResult')
  };

  // Initialize App
  async function init() {
    setupTheme();
    setupBubbleEffect();
    await loadQuizData();
    setupRouting();
    updateTotalResponsesBadge();

    // Render landing mascot
    if (window.MascotSVGs && els.landingMascot) {
      els.landingMascot.innerHTML = window.MascotSVGs.default;
    }

    // Attach Event Listeners
    if (els.startQuizBtn) {
      els.startQuizBtn.addEventListener('click', startQuiz);
    }
    if (els.btnBack) {
      els.btnBack.addEventListener('click', goBack);
    }
    if (els.btnRetake) {
      els.btnRetake.addEventListener('click', resetQuiz);
    }
    if (els.btnShareCard) {
      els.btnShareCard.addEventListener('click', generateAndShareCard);
    }
    if (els.btnCopyLink) {
      els.btnCopyLink.addEventListener('click', copyShareLink);
    }
    if (els.brandHomeBtn) {
      els.brandHomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showView('landing');
      });
    }
    if (els.btnResponsesNav) {
      els.btnResponsesNav.addEventListener('click', () => {
        showView('dashboard');
        if (window.HydrationDashboard) {
          window.HydrationDashboard.refresh();
        }
      });
    }
    if (els.btnViewCollectionFromResult) {
      els.btnViewCollectionFromResult.addEventListener('click', () => {
        showView('dashboard');
        if (window.HydrationDashboard) {
          window.HydrationDashboard.refresh();
        }
      });
    }
  }

  // Load Quiz Definition Data
  async function loadQuizData() {
    try {
      const res = await fetch('/data/quiz_data.json');
      if (res.ok) {
        state.quizData = await res.json();
      } else {
        throw new Error('Failed to fetch JSON');
      }
    } catch (e) {
      console.warn('Could not load quiz_data.json, using fallback data:', e);
      state.quizData = getFallbackQuizData();
    }
  }

  // Fallback quiz data if network fails
  function getFallbackQuizData() {
    return {
      questions: [
        {
          id: 'q1',
          number: 1,
          type: 'intake_toggle',
          question: 'How many glasses (about 250 ml) of water do you drink on a typical day?',
          subtitle: 'The foundation question! Feel free to switch between glasses and litres.',
          options: [
            { id: '0-2', points: 0, glasses: '0 - 2 glasses', litres: '< 0.75 L', tagline: 'Runs on vibes & coffee', icon: '☕' },
            { id: '3-4', points: 1, glasses: '3 - 4 glasses', litres: '0.75 - 1.2 L', tagline: 'A casual sip now and then', icon: '🥤' },
            { id: '5-6', points: 2, glasses: '5 - 6 glasses', litres: '1.25 - 1.7 L', tagline: 'Cruising at a steady pace', icon: '🥛' },
            { id: '7-8', points: 3, glasses: '7 - 8 glasses', litres: '1.75 - 2.2 L', tagline: 'Hitting optimal flow', icon: '✨' },
            { id: '9+', points: 4, glasses: '9+ glasses', litres: '2.25+ L', tagline: 'Basically a human fountain', icon: '🌊' }
          ]
        },
        {
          id: 'q2',
          number: 2,
          type: 'scale_7',
          question: "What's the first thing you drink in the morning?",
          statement: "The very first drink I reach for after getting out of bed is a glass of water.",
          traitKeys: ["timing", "habit"],
          traitWeights: [0.65, 0.35],
          fact: "Drinking water first thing helps kickstart your metabolism and clears out nighttime cellular waste."
        },
        {
          id: 'q3',
          number: 3,
          type: 'scale_7',
          question: "How often do you carry a water bottle?",
          statement: "My reusable water bottle goes everywhere with me like an emotional support buddy.",
          traitKeys: ["habit", "consistency"],
          traitWeights: [0.6, 0.4],
          fact: "People who keep a reusable bottle within arm's reach drink up to 40% more water throughout the day."
        },
        {
          id: 'q4',
          number: 4,
          type: 'scale_7',
          question: "You feel thirsty. What do you do?",
          statement: "When I notice I'm thirsty, I immediately stop and grab a drink instead of postponing it.",
          traitKeys: ["awareness", "consistency"],
          traitWeights: [0.7, 0.3],
          fact: "Thirst is your body's late alert system — responding right away prevents the afternoon brain fog."
        },
        {
          id: 'q5',
          number: 5,
          type: 'scale_7',
          question: "How much do you drink during meals?",
          statement: "I routinely sip water alongside my meals and snacks throughout the day.",
          traitKeys: ["consistency", "volume"],
          traitWeights: [0.6, 0.4],
          fact: "Sipping water with food aids smooth nutrient absorption and keeps your digestion balanced."
        },
        {
          id: 'q6',
          number: 6,
          type: 'scale_7',
          question: "On a hot or busy day, what happens to your water intake?",
          statement: "Even during chaotic deadlines or back-to-back meetings, my hydration remains on point.",
          traitKeys: ["consistency", "awareness"],
          traitWeights: [0.5, 0.5],
          fact: "Under stress, cortisol increases fluid loss — keeping a water cue helps you stay grounded."
        },
        {
          id: 'q7',
          number: 7,
          type: 'scale_7',
          question: "How would your friends describe your relationship with water?",
          statement: "My friends would describe me as someone who is constantly sipping or talking about hydration.",
          traitKeys: ["volume", "habit", "awareness"],
          traitWeights: [0.35, 0.35, 0.3],
          fact: "The brain is about 73% water. Staying hydrated is quite literally feeding your brain clarity!"
        }
      ],
      personalities: {
        cactus: {
          id: 'cactus',
          name: 'The Cactus',
          emoji: '🌵',
          typicalIntake: '0-2 glasses',
          vibe: 'Runs on vibes and occasional chai',
          description: "You are biologically equipped to survive the desert on sheer willpower and iced coffee. Water is basically a myth you've heard whispers about.",
          chillAdvice: 'Keep a bottle where you can see it. Take a sip every time you unlock your phone. Tiny wins count.',
          waterTwin: 'A resilient desert succulent living on sunbeams and optimism',
          superpower: { title: 'Superpower: Extreme Grit', description: 'Can pull an entire 8-hour workday on 2 drops of liquid and sheer vibes.' },
          growth: { title: 'Growth Area: Visible Cues', description: 'Deep in a work spiral? Your water bottle sits untouched. Put it right next to your keyboard!' }
        },
        casual_sipper: {
          id: 'casual_sipper',
          name: 'The Casual Sipper',
          emoji: '🐈',
          typicalIntake: '3-4 glasses',
          vibe: 'Drinks when reminded',
          description: "You've got cute tumblers and great intentions, but out of sight is out of mind. You drink when someone else takes a sip or your mouth feels dry.",
          chillAdvice: "You're close. Add one glass with each meal and you're there.",
          waterTwin: 'A curious housecat that only inspects running tap water occasionally',
          superpower: { title: 'Superpower: Social Hydration', description: 'Ready to drink whenever prompted by your environment — you just need a friendly nudge.' },
          growth: { title: 'Growth Area: Routine Anchors', description: 'Relying on thirst alone means hours pass unnoticed. Anchor a sip to your daily habits!' }
        },
        steady_turtle: {
          id: 'steady_turtle',
          name: 'The Steady Turtle',
          emoji: '🐢',
          typicalIntake: '5-6 glasses',
          vibe: 'Slow, consistent, unbothered',
          description: "Unshakeable, calm, and quietly disciplined. You don't make a big scene out of drinking water; you just keep an easy, continuous pace.",
          chillAdvice: 'Solid pace. Try a glass right after waking up for a bonus boost.',
          waterTwin: 'An ancient sea turtle gliding peacefully along the reef current',
          superpower: { title: 'Superpower: Unflappable Flow', description: 'You maintain a solid baseline day after day without needing fancy alarms or drama.' },
          growth: { title: 'Growth Area: Morning Kickstart', description: "You're great during the afternoon, but a morning glass could give you an early glow boost." }
        },
        happy_dolphin: {
          id: 'happy_dolphin',
          name: 'The Happy Dolphin',
          emoji: '🐬',
          typicalIntake: '7-8 glasses',
          vibe: 'Hydrated and thriving',
          description: "You have mastered the art of cellular happiness. Your skin is radiant, your organs are cheering, and your water bottle has personalized stickers.",
          chillAdvice: "You've got it figured out. Keep your bottle handy on busy days.",
          waterTwin: 'A joyful dolphin performing backflips in sparkling turquoise waves',
          superpower: { title: 'Superpower: Radiant Instinct', description: 'Hydration is second nature to you — intuitive, effortless, and genuinely energizing.' },
          growth: { title: 'Growth Area: Meeting Defense', description: "Keep that bottle filled before back-to-back calls so your flow doesn't hit a dry spell." }
        },
        water_whale: {
          id: 'water_whale',
          name: 'The Water Whale',
          emoji: '🐋',
          typicalIntake: '9+ glasses',
          vibe: 'Basically a walking reservoir',
          description: "A magnificent aquatic legend. You carry gallon jugs without hesitation, your bathroom visits are legendary, and you are approximately 99.4% pure water.",
          chillAdvice: 'Respect. Listen to your body and balance with meals. Hydration is a vibe, not a competition.',
          waterTwin: 'A mighty blue whale roaming the open ocean in supreme majesty',
          superpower: { title: 'Superpower: Peak Circulation', description: 'Immense fluid stamina that leaves dry dehydration in another dimension.' },
          growth: { title: 'Growth Area: Electrolyte Harmony', description: 'Remember to balance with healthy salts & snacks — water is a vibe, not a speedrun!' }
        }
      }
    };
  }

  // Handle URL hash routes (e.g. #responses or #result=steady_turtle)
  function setupRouting() {
    window.addEventListener('hashchange', checkHashRoute);
    checkHashRoute();
  }

  function checkHashRoute() {
    const hash = window.location.hash;
    if (hash === '#creator' || hash === '#responses' || hash === '#dashboard' || hash === '#admin') {
      if (window.HydrationDashboard) {
        window.HydrationDashboard.openAuthOrDashboard();
      }
    } else if (hash.startsWith('#result=')) {
      const pId = hash.replace('#result=', '');
      showResultByPersonalityId(pId);
    }
  }

  // View Switcher
  function showView(viewName) {
    els.landingView.classList.add('hidden');
    els.quizView.classList.add('hidden');
    els.loadingView.classList.add('hidden');
    els.resultView.classList.add('hidden');
    els.dashboardView.classList.add('hidden');

    if (viewName === 'landing') {
      els.landingView.classList.remove('hidden');
      window.location.hash = '';
    } else if (viewName === 'quiz') {
      els.quizView.classList.remove('hidden');
    } else if (viewName === 'loading') {
      els.loadingView.classList.remove('hidden');
    } else if (viewName === 'result') {
      els.resultView.classList.remove('hidden');
    } else if (viewName === 'dashboard') {
      els.dashboardView.classList.remove('hidden');
      window.location.hash = '#responses';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Start Quiz
  function startQuiz() {
    const rawName = els.userNameInput ? els.userNameInput.value.trim() : '';
    state.userName = rawName || 'Friend';
    state.currentStep = 1;
    state.answers = {};
    state.startTime = Date.now();
    showView('quiz');
    renderQuestion(1);
  }

  // Reset Quiz
  function resetQuiz() {
    state.currentStep = 0;
    state.answers = {};
    state.calculatedResult = null;
    showView('landing');
  }

  // Go to previous step
  function goBack() {
    if (state.currentStep > 1) {
      state.currentStep--;
      renderQuestion(state.currentStep);
    } else {
      showView('landing');
    }
  }

  // Render Question
  function renderQuestion(qIndex) {
    const question = state.quizData.questions[qIndex - 1];
    if (!question) return;

    // Header & progress
    els.stepIndicator.textContent = `QUESTION ${qIndex} OF 7`;
    const progressPercent = Math.round(((qIndex - 1) / 7) * 100);
    els.progressBarFill.style.width = `${progressPercent}%`;

    els.questionTitle.textContent = question.question;
    els.questionSubtitle.textContent = question.subtitle || 'Select the option that best matches your usual rhythm.';

    // Fact pill
    if (question.fact) {
      els.factCard.classList.remove('hidden');
      els.factText.textContent = question.fact;
    } else {
      els.factCard.classList.add('hidden');
    }

    // Render Question Body
    els.questionBody.innerHTML = '';

    if (question.type === 'intake_toggle') {
      renderIntakeQuestion(question);
    } else if (question.type === 'scale_7') {
      renderScaleQuestion(question);
    }
  }

  // Render Q1: Big tappable choice cards with Unit Toggle
  function renderIntakeQuestion(question) {
    const wrapper = document.createElement('div');

    // Unit toggle row
    const toggleWrap = document.createElement('div');
    toggleWrap.className = 'unit-toggle-wrap';
    toggleWrap.innerHTML = `
      <div class="unit-toggle-pill">
        <button type="button" class="unit-btn ${state.unitMode === 'glasses' ? 'active' : ''}" data-unit="glasses">Glasses (250ml)</button>
        <button type="button" class="unit-btn ${state.unitMode === 'litres' ? 'active' : ''}" data-unit="litres">Litres (L)</button>
      </div>
    `;

    // Cards list
    const grid = document.createElement('div');
    grid.className = 'intake-cards-grid';

    const selectedVal = state.answers['q1'];

    question.options.forEach(opt => {
      const card = document.createElement('div');
      card.className = `intake-choice-card ${selectedVal === opt.id ? 'selected' : ''}`;
      card.dataset.optId = opt.id;
      
      const labelText = state.unitMode === 'glasses' ? opt.glasses : opt.litres;

      card.innerHTML = `
        <div class="choice-icon">${opt.icon}</div>
        <div class="choice-content">
          <div class="choice-title">${labelText}</div>
          <div class="choice-desc">${opt.tagline}</div>
        </div>
        <div class="choice-radio-circle"></div>
      `;

      card.addEventListener('click', () => {
        state.answers['q1'] = opt.id;
        grid.querySelectorAll('.intake-choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        // Gentle micro-delay for smooth tap visual
        setTimeout(() => {
          advanceNextQuestion();
        }, 220);
      });

      grid.appendChild(card);
    });

    // Toggle button handler: update button states and option labels IN-PLACE without re-rendering or duplicating!
    toggleWrap.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        state.unitMode = btn.dataset.unit;
        
        // Update active class on toggle buttons
        toggleWrap.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update card label titles in-place
        question.options.forEach(opt => {
          const card = grid.querySelector(`[data-opt-id="${opt.id}"]`);
          if (card) {
            const titleEl = card.querySelector('.choice-title');
            if (titleEl) {
              titleEl.textContent = state.unitMode === 'glasses' ? opt.glasses : opt.litres;
            }
          }
        });
      });
    });

    wrapper.appendChild(toggleWrap);
    wrapper.appendChild(grid);
    els.questionBody.innerHTML = '';
    els.questionBody.appendChild(wrapper);
  }

  // Render Q2-Q7: 16Personalities 7-circle Agree/Disagree scale
  function renderScaleQuestion(question) {
    const wrapper = document.createElement('div');

    // Prompt statement card
    const stmtCard = document.createElement('div');
    stmtCard.className = 'statement-card';
    stmtCard.innerHTML = `<p class="statement-text">"${question.statement}"</p>`;
    wrapper.appendChild(stmtCard);

    // 7-circle Scale container
    const scaleContainer = document.createElement('div');
    scaleContainer.className = 'scale-container';

    scaleContainer.innerHTML = `
      <div class="scale-labels">
        <span class="scale-label-disagree">Disagree</span>
        <span class="scale-label-agree">Agree</span>
      </div>
      <div class="scale-circles-row">
        <div class="scale-track-line"></div>
        <button type="button" class="scale-circle-btn" data-val="1" title="Strongly Disagree"></button>
        <button type="button" class="scale-circle-btn" data-val="2" title="Disagree"></button>
        <button type="button" class="scale-circle-btn" data-val="3" title="Slightly Disagree"></button>
        <button type="button" class="scale-circle-btn" data-val="4" title="Neutral"></button>
        <button type="button" class="scale-circle-btn" data-val="5" title="Slightly Agree"></button>
        <button type="button" class="scale-circle-btn" data-val="6" title="Agree"></button>
        <button type="button" class="scale-circle-btn" data-val="7" title="Strongly Agree"></button>
      </div>
    `;

    const selectedVal = state.answers[question.id];
    if (selectedVal) {
      const activeBtn = scaleContainer.querySelector(`[data-val="${selectedVal}"]`);
      if (activeBtn) activeBtn.classList.add('selected');
    }

    scaleContainer.querySelectorAll('.scale-circle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.val, 10);
        state.answers[question.id] = val;
        
        scaleContainer.querySelectorAll('.scale-circle-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        setTimeout(() => {
          advanceNextQuestion();
        }, 220);
      });
    });

    wrapper.appendChild(scaleContainer);
    els.questionBody.appendChild(wrapper);
  }

  // Advance to next question or trigger loading
  function advanceNextQuestion() {
    if (state.currentStep < 7) {
      state.currentStep++;
      renderQuestion(state.currentStep);
    } else {
      triggerLoading();
    }
  }

  // Retro Pixel Loading Animation (1-2 seconds per PRD)
  function triggerLoading() {
    showView('loading');
    if (window.MascotSVGs && els.loadingMascot) {
      els.loadingMascot.innerHTML = window.MascotSVGs.loading || window.MascotSVGs.default;
    }

    const messages = [
      'Measuring daily sip patterns...',
      'Calculating cellular flow rate...',
      'Consulting water deities...',
      'Generating hydration personality...'
    ];

    let progress = 0;
    let msgIdx = 0;
    const interval = setInterval(() => {
      progress += 14;
      if (progress > 100) progress = 100;
      els.loadingProgressBar.style.width = `${progress}%`;
      
      if (progress >= 30 && msgIdx === 0) {
        msgIdx = 1;
        els.loadingStatus.textContent = messages[1];
      } else if (progress >= 60 && msgIdx === 1) {
        msgIdx = 2;
        els.loadingStatus.textContent = messages[2];
      } else if (progress >= 85 && msgIdx === 2) {
        msgIdx = 3;
        els.loadingStatus.textContent = messages[3];
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          finishQuizAndCalculate();
        }, 300);
      }
    }, 180);
  }

  // Calculate Scores, Traits, and Personality Result
  function finishQuizAndCalculate() {
    const q1OptionId = state.answers['q1'] || '3-4';
    const q1Map = { '0-2': 0, '3-4': 1, '5-6': 2, '7-8': 3, '9+': 4 };
    const q1Points = q1Map[q1OptionId] !== undefined ? q1Map[q1OptionId] : 1;

    // Q1 contributes 50% (0 to 5.0 pts)
    const q1Score = q1Points * 1.25;

    // Q2-Q7 contribute 50% (0 to 5.0 pts)
    let behaviorSum = 0;
    let behaviorCount = 0;
    for (let i = 2; i <= 7; i++) {
      const qVal = state.answers[`q${i}`] || 4; // default neutral 4
      const normalized = (qVal - 1) / 6; // 0 to 1
      behaviorSum += normalized;
      behaviorCount++;
    }
    const behaviorScore = (behaviorSum / behaviorCount) * 5.0;
    const totalScore = Math.round((q1Score + behaviorScore) * 10) / 10;

    // Personality band mapping
    let personalityId = 'steady_turtle';
    if (totalScore < 2.5) {
      personalityId = 'cactus';
    } else if (totalScore < 4.5) {
      personalityId = 'casual_sipper';
    } else if (totalScore < 6.5) {
      personalityId = 'steady_turtle';
    } else if (totalScore < 8.5) {
      personalityId = 'happy_dolphin';
    } else {
      personalityId = 'water_whale';
    }

    // Trait Calculations (%)
    // Traits: volume, consistency, timing, awareness, habit
    const q2 = state.answers['q2'] || 4;
    const q3 = state.answers['q3'] || 4;
    const q4 = state.answers['q4'] || 4;
    const q5 = state.answers['q5'] || 4;
    const q6 = state.answers['q6'] || 4;
    const q7 = state.answers['q7'] || 4;

    const baseVolume = (q1Points / 4) * 75 + ((q5 + q7) / 14) * 25;
    const baseConsistency = ((q3 + q4 + q5 + q6) / 28) * 100;
    const baseTiming = ((q2 * 1.5 + q4) / 17.5) * 100;
    const baseAwareness = ((q4 * 1.5 + q6 + q7) / 24.5) * 100;
    const baseHabit = ((q2 + q3 * 1.5 + q6) / 24.5) * 100;

    const clamp = (v) => Math.max(15, Math.min(99, Math.round(v)));

    const traits = {
      volume: clamp(baseVolume),
      consistency: clamp(baseConsistency),
      timing: clamp(baseTiming),
      awareness: clamp(baseAwareness),
      habit: clamp(baseHabit)
    };

    const personalityData = state.quizData.personalities[personalityId];

    state.calculatedResult = {
      id: `resp_${Date.now()}`,
      userName: state.userName,
      personalityId: personalityId,
      personalityName: personalityData.name,
      emoji: personalityData.emoji,
      vibe: personalityData.vibe,
      chillAdvice: personalityData.chillAdvice,
      description: personalityData.description,
      waterTwin: personalityData.waterTwin,
      totalScore: totalScore,
      traits: traits,
      answers: { ...state.answers },
      metadata: {
        unitMode: state.unitMode,
        timeTakenSec: Math.round((Date.now() - (state.startTime || Date.now())) / 1000)
      }
    };

    // Save to backend & local collection
    saveResponseRecord(state.calculatedResult);

    // Display Results View
    renderResultView(state.calculatedResult);
    showView('result');
    window.location.hash = `#result=${personalityId}`;
  }

  // Display result by preset personality ID (direct link support e.g. #result=turtle)
  function showResultByPersonalityId(pId) {
    if (!state.quizData) return;
    const pData = state.quizData.personalities[pId];
    if (!pData) return;

    const defaultTraits = {
      cactus: { volume: 22, consistency: 28, timing: 20, awareness: 32, habit: 25, score: 1.6 },
      casual_sipper: { volume: 44, consistency: 48, timing: 42, awareness: 50, habit: 46, score: 3.8 },
      steady_turtle: { volume: 68, consistency: 78, timing: 65, awareness: 72, habit: 74, score: 5.7 },
      happy_dolphin: { volume: 88, consistency: 86, timing: 84, awareness: 90, habit: 88, score: 7.9 },
      water_whale: { volume: 98, consistency: 94, timing: 90, awareness: 95, habit: 96, score: 9.5 }
    };

    const preset = defaultTraits[pId] || defaultTraits.steady_turtle;
    state.calculatedResult = {
      id: `shared_${pId}`,
      personalityId: pId,
      personalityName: pData.name,
      emoji: pData.emoji,
      vibe: pData.vibe,
      chillAdvice: pData.chillAdvice,
      description: pData.description,
      waterTwin: pData.waterTwin,
      totalScore: preset.score,
      traits: preset,
      answers: { q1: '5-6', q2: 5, q3: 5, q4: 5, q5: 5, q6: 5, q7: 5 },
      metadata: { unitMode: 'glasses', timeTakenSec: 60 }
    };

    renderResultView(state.calculatedResult);
    showView('result');
  }

  // Render Result View Components
  function renderResultView(res) {
    const pData = state.quizData.personalities[res.personalityId];

    // Mascot with customized SVG
    if (window.MascotSVGs && els.resultMascot) {
      els.resultMascot.innerHTML = window.MascotSVGs[res.personalityId] || window.MascotSVGs.default;
    }

    const speechBubble = document.querySelector('#resultView .speech-bubble');
    if (speechBubble) {
      speechBubble.textContent = `Here's your hydration personality, ${res.userName || state.userName}! ✨`;
    }

    if (els.resultForUser) {
      els.resultForUser.textContent = `Hydration Profile for ${res.userName || state.userName}`;
    }

    if (els.resultEmoji) {
      els.resultEmoji.textContent = res.emoji;
    }
    els.resultName.textContent = res.personalityName;
    els.resultVibe.textContent = `"${res.vibe}"`;
    els.resultDesc.textContent = res.description;

    // Superpower & Growth Cards
    const traitEntries = Object.entries(res.traits).filter(([k]) => k !== 'score');
    traitEntries.sort((a, b) => b[1] - a[1]);
    const highestTrait = traitEntries[0];
    const lowestTrait = traitEntries[traitEntries.length - 1];

    const traitLabels = {
      volume: 'Volume',
      consistency: 'Consistency',
      timing: 'Timing',
      awareness: 'Awareness',
      habit: 'Habit'
    };

    // Render Superpower
    els.superpowerBox.innerHTML = `
      <div class="highlight-badge">⭐ Superpower: ${traitLabels[highestTrait[0]]} (${highestTrait[1]}%)</div>
      <div class="highlight-title">${pData.superpower ? pData.superpower.title : 'Natural Fluidity'}</div>
      <div class="highlight-desc">${pData.superpower ? pData.superpower.description : 'Maintains a comfortable hydration rhythm.'}</div>
    `;

    // Render Growth
    els.growthBox.innerHTML = `
      <div class="highlight-badge">🌱 Growth Area: ${traitLabels[lowestTrait[0]]} (${lowestTrait[1]}%)</div>
      <div class="highlight-title">${pData.growth ? pData.growth.title : 'Gentle Nudge'}</div>
      <div class="highlight-desc">${pData.growth ? pData.growth.description : 'Room for an extra sip here and there.'}</div>
    `;

    // Chill Tip & Twin
    els.tipText.textContent = res.chillAdvice;
    els.twinText.innerHTML = `Your Water Twin: <strong class="twin-strong">${res.waterTwin}</strong>`;

    // Render SVG Radar Chart
    renderRadarChart(res.traits);
  }

  // Draw SVG Radar Chart
  function renderRadarChart(traits) {
    const keys = ['volume', 'consistency', 'timing', 'awareness', 'habit'];
    const labels = ['Volume', 'Consistency', 'Timing', 'Awareness', 'Habit'];
    const values = keys.map(k => (traits[k] || 50) / 100);

    const size = 300;
    const center = size / 2;
    const radius = 100;
    const totalSides = 5;

    function getCoords(angleIndex, r) {
      const angle = (Math.PI * 2 / totalSides) * angleIndex - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y };
    }

    // Grid circles
    let gridCircles = '';
    [0.25, 0.5, 0.75, 1.0].forEach(level => {
      let pts = [];
      for (let i = 0; i < totalSides; i++) {
        const c = getCoords(i, radius * level);
        pts.push(`${c.x.toFixed(1)},${c.y.toFixed(1)}`);
      }
      gridCircles += `<polygon points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-opacity="0.12" stroke-width="1.2"/>`;
    });

    // Axis lines & labels
    let axes = '';
    let labelElements = '';
    for (let i = 0; i < totalSides; i++) {
      const outer = getCoords(i, radius);
      axes += `<line x1="${center}" y1="${center}" x2="${outer.x}" y2="${outer.y}" stroke="currentColor" stroke-opacity="0.15" stroke-width="1.2"/>`;

      // Label coords slightly outside
      const labelCoord = getCoords(i, radius + 24);
      const valText = `${traits[keys[i]] || 50}%`;
      labelElements += `
        <text x="${labelCoord.x}" y="${labelCoord.y}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="currentColor">
          ${labels[i]}
          <tspan x="${labelCoord.x}" dy="12" font-size="9" font-weight="500" fill="#028090">${valText}</tspan>
        </text>
      `;
    }

    // Data polygon
    let polyPoints = [];
    for (let i = 0; i < totalSides; i++) {
      const c = getCoords(i, radius * values[i]);
      polyPoints.push(`${c.x.toFixed(1)},${c.y.toFixed(1)}`);
    }

    const svg = `
      <svg viewBox="0 0 ${size} ${size}" width="100%" height="280" style="color: var(--text-main);" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="polyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#2EC4B6" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#028090" stop-opacity="0.3"/>
          </linearGradient>
        </defs>
        ${gridCircles}
        ${axes}
        <polygon points="${polyPoints.join(' ')}" fill="url(#polyGrad)" stroke="#028090" stroke-width="2.5"/>
        ${polyPoints.map(p => {
          const [px, py] = p.split(',');
          return `<circle cx="${px}" cy="${py}" r="4" fill="#2EC4B6" stroke="#ffffff" stroke-width="2"/>`;
        }).join('')}
        ${labelElements}
      </svg>
    `;

    els.radarContainer.innerHTML = svg;
  }

  // Save Response Record (Backend API + Google Sheets + LocalStorage)
  async function saveResponseRecord(record) {
    // 1. LocalStorage collection backup
    try {
      const local = JSON.parse(localStorage.getItem('uhv_responses') || '[]');
      local.unshift(record);
      localStorage.setItem('uhv_responses', JSON.stringify(local));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 2. Google Sheet Webhook Sync (direct save to creator's Google Drive)
    if (GOOGLE_SHEET_WEBHOOK_URL) {
      try {
        fetch(GOOGLE_SHEET_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        }).then(() => {
          console.log('✅ Response synced to Google Sheet successfully!');
        }).catch(err => {
          console.warn('Google Sheet sync notice:', err);
        });
      } catch (e) {
        console.warn('Google Sheet sync error:', e);
      }
    }

    // 3. Server API POST
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        console.log('Saved to server responses collection successfully!');
      }
    } catch (e) {
      console.log('Server API save note (offline mode or static host):', e);
    }

    updateTotalResponsesBadge();
  }

  // Update navbar badge count
  async function updateTotalResponsesBadge() {
    if (!els.badgeResponsesCount) return;
    const token = sessionStorage.getItem('hydration_creator_token');
    if (!token) return;

    try {
      const res = await fetch('/api/responses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        state.totalResponsesCount = data.total;
        els.badgeResponsesCount.textContent = data.total;
      }
    } catch (e) {
      // Ignored
    }
  }

  // Share card generator: generates a downloadable PNG image card
  function generateAndShareCard() {
    if (!state.calculatedResult) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 700;

    // Background gradient (soft cream to cyan)
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 700);
    bgGrad.addColorStop(0, '#FFFDF8');
    bgGrad.addColorStop(1, '#E0FBFC');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 700);

    // Subtle retro pixel border
    ctx.strokeStyle = '#028090';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 568, 668);

    ctx.strokeStyle = '#2EC4B6';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, 556, 656);

    // Title & Brand
    ctx.fillStyle = '#028090';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const nameUpper = (state.calculatedResult.userName && state.calculatedResult.userName !== 'Friend') 
      ? `${state.calculatedResult.userName.toUpperCase()}'S HYDRATION PERSONALITY`
      : 'FIND YOUR HYDRATION PERSONALITY';
    ctx.fillText(nameUpper, 300, 65);

    // Emoji
    ctx.font = '72px sans-serif';
    ctx.fillText(state.calculatedResult.emoji, 300, 160);

    // Personality Name
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(state.calculatedResult.personalityName, 300, 220);

    // Vibe
    ctx.fillStyle = '#028090';
    ctx.font = 'italic 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`"${state.calculatedResult.vibe}"`, 300, 260);

    // Trait stats box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(50, 290, 500, 210);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 290, 500, 210);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HYDRATION METRICS', 75, 330);

    const traits = state.calculatedResult.traits;
    const metricList = [
      { label: 'Volume', val: traits.volume },
      { label: 'Consistency', val: traits.consistency },
      { label: 'Timing', val: traits.timing },
      { label: 'Awareness', val: traits.awareness },
      { label: 'Habit', val: traits.habit }
    ];

    metricList.forEach((m, idx) => {
      const y = 370 + idx * 24;
      ctx.fillStyle = '#64748B';
      ctx.font = '15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(m.label, 75, y);

      // Bar track
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(200, y - 11, 260, 10);
      // Bar fill
      ctx.fillStyle = '#2EC4B6';
      ctx.fillRect(200, y - 11, (260 * m.val) / 100, 10);

      ctx.fillStyle = '#028090';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${m.val}%`, 480, y);
    });

    // Chill Advice
    ctx.fillStyle = '#0F172A';
    ctx.font = 'italic 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Tip: ${state.calculatedResult.chillAdvice}`, 300, 545);

    // Water Twin
    ctx.fillStyle = '#64748B';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Water Twin: ${state.calculatedResult.waterTwin}`, 300, 580);

    // Footer
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Just for fun, not medical advice. Take the quiz at find-your-hydration.app', 300, 645);

    // Download image
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `hydration_${state.calculatedResult.personalityId}_result.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Show quick feedback
    const originalText = els.btnShareCard.innerHTML;
    els.btnShareCard.innerHTML = '<span>✅ Result Card Downloaded!</span>';
    setTimeout(() => {
      els.btnShareCard.innerHTML = originalText;
    }, 2500);
  }

  // Copy result link to clipboard
  function copyShareLink() {
    const shareUrl = window.location.origin + window.location.pathname + `#result=${state.calculatedResult.personalityId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showCopyToast('🔗 Link copied to clipboard!');
      });
    } else {
      prompt('Copy this link to share your hydration personality:', shareUrl);
    }
  }

  function showCopyToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #028090;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: fadeInOut 2.5s forwards;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2500);
  }

  // Sound-free subtle micro-interaction: tiny light-blue water droplets on tap/click
  function setupBubbleEffect() {
    function spawnDroplets(clientX, clientY) {
      const count = 4;
      for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = 'tap-water-droplet';
        
        // Random scatter angle and distance
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 24 + 10; // 10px to 34px scatter
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist - 8; // slight upward float
        const rot = Math.random() * 50 - 25; // slight rotation
        
        // Random tiny size: 6px to 8px
        const w = Math.random() * 2.5 + 6;
        drop.style.width = `${w}px`;
        drop.style.height = `${w * 1.35}px`;
        drop.style.left = `${clientX}px`;
        drop.style.top = `${clientY}px`;
        drop.style.setProperty('--dx', `${dx.toFixed(1)}px`);
        drop.style.setProperty('--dy', `${dy.toFixed(1)}px`);
        drop.style.setProperty('--rot', `${rot.toFixed(1)}deg`);

        document.body.appendChild(drop);
        setTimeout(() => {
          if (drop.parentNode) drop.parentNode.removeChild(drop);
        }, 650);
      }
    }

    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      spawnDroplets(e.clientX, e.clientY);
    });

    document.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        if (touch.target.tagName === 'INPUT' || touch.target.tagName === 'TEXTAREA') return;
        spawnDroplets(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    // Populate animated background bubbles
    const bgContainer = document.getElementById('bgBubbles');
    if (bgContainer) {
      for (let i = 0; i < 14; i++) {
        const b = document.createElement('div');
        b.className = 'bg-bubble';
        const size = Math.floor(Math.random() * 28) + 12;
        b.style.width = `${size}px`;
        b.style.height = `${size}px`;
        b.style.left = `${Math.random() * 96}%`;
        b.style.animationDelay = `${(Math.random() * 12).toFixed(1)}s`;
        b.style.animationDuration = `${(Math.random() * 10 + 10).toFixed(1)}s`;
        bgContainer.appendChild(b);
      }
    }
  }

  // Theme Management (Defaults strictly to Light Mode)
  function setupTheme() {
    // Reset any old stored dark mode preference so default is always Light Mode
    if (localStorage.getItem('uhv_theme') === 'dark' && !sessionStorage.getItem('uhv_theme_explicit')) {
      localStorage.setItem('uhv_theme', 'light');
    }

    const currentSession = sessionStorage.getItem('uhv_theme');
    if (currentSession === 'dark') {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }

    if (els.btnToggleTheme) {
      els.btnToggleTheme.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const next = isDark ? 'light' : 'dark';
        sessionStorage.setItem('uhv_theme_explicit', 'true');
        applyTheme(next);
      });
    }
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (els.themeIcon) els.themeIcon.textContent = '☀️';
      sessionStorage.setItem('uhv_theme', 'dark');
      localStorage.setItem('uhv_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', 'light');
      if (els.themeIcon) els.themeIcon.textContent = '🌙';
      sessionStorage.setItem('uhv_theme', 'light');
      localStorage.setItem('uhv_theme', 'light');
    }
  }

  // Expose state for debugging & dashboard integration
  window.HydrationApp = {
    state,
    startQuiz,
    showView,
    updateTotalResponsesBadge
  };

  // Run on load
  document.addEventListener('DOMContentLoaded', init);
})();
