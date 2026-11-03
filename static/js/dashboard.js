/**
 * Find Your Hydration Personality - Creator Portal & Analytics Dashboard
 * Secure, authenticated dashboard for the quiz creator.
 * Features:
 * - Server-side Bearer token authentication
 * - Constant-time comparison & rate limiting defense
 * - Zero data leakage to unauthenticated users
 * - Full responses search, filter, CSV & JSON export
 */

(function () {
  'use strict';

  let responsesData = [];
  let filteredData = [];

  const els = {
    // Auth Modal Elements
    creatorAuthModal: document.getElementById('creatorAuthModal'),
    creatorLoginForm: document.getElementById('creatorLoginForm'),
    creatorUsername: document.getElementById('creatorUsername'),
    creatorPassword: document.getElementById('creatorPassword'),
    authErrorMessage: document.getElementById('authErrorMessage'),
    btnCancelAuth: document.getElementById('btnCancelAuth'),
    btnOpenCreatorModal: document.getElementById('btnOpenCreatorModal'),
    btnLogoutCreator: document.getElementById('btnLogoutCreator'),

    // KPI elements
    totalResponsesCount: document.getElementById('dashTotalCount'),
    topPersonalityBadge: document.getElementById('dashTopPersonality'),
    avgIntakeVal: document.getElementById('dashAvgIntake'),
    avgScoreVal: document.getElementById('dashAvgScore'),

    // Distribution & Trait containers
    distBarsContainer: document.getElementById('distBarsContainer'),
    traitAveragesContainer: document.getElementById('traitAveragesContainer'),

    // Table elements
    responsesTableBody: document.getElementById('responsesTableBody'),
    tableCountSummary: document.getElementById('tableCountSummary'),
    searchInput: document.getElementById('dashSearchInput'),
    filterPersonality: document.getElementById('dashFilterPersonality'),

    // Action buttons
    btnExportCsv: document.getElementById('btnExportCsv'),
    btnExportJson: document.getElementById('btnExportJson'),
    btnSeedDemo: document.getElementById('btnSeedDemo'),
    btnClearData: document.getElementById('btnClearData'),
    btnBackToHome: document.getElementById('btnBackToHome')
  };

  // Helper: Retrieve active creator token from sessionStorage
  function getAuthToken() {
    return sessionStorage.getItem('hydration_creator_token');
  }

  function setAuthToken(token) {
    if (token) {
      sessionStorage.setItem('hydration_creator_token', token);
    } else {
      sessionStorage.removeItem('hydration_creator_token');
    }
  }

  async function initDashboard() {
    // Attach auth modal triggers
    if (els.btnOpenCreatorModal) {
      els.btnOpenCreatorModal.addEventListener('click', () => {
        openAuthOrDashboard();
      });
    }

    if (els.btnCancelAuth) {
      els.btnCancelAuth.addEventListener('click', closeAuthModal);
    }

    if (els.creatorLoginForm) {
      els.creatorLoginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (els.btnLogoutCreator) {
      els.btnLogoutCreator.addEventListener('click', handleLogout);
    }

    // Keyboard shortcut for Creator: Ctrl + Shift + C
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        openAuthOrDashboard();
      }
    });

    // Dashboard Controls
    if (els.searchInput) {
      els.searchInput.addEventListener('input', applyFilters);
    }
    if (els.filterPersonality) {
      els.filterPersonality.addEventListener('change', applyFilters);
    }
    if (els.btnExportCsv) {
      els.btnExportCsv.addEventListener('click', handleExportCsv);
    }
    if (els.btnExportJson) {
      els.btnExportJson.addEventListener('click', handleExportJson);
    }
    if (els.btnSeedDemo) {
      els.btnSeedDemo.addEventListener('click', handleSeedDemo);
    }
    if (els.btnClearData) {
      els.btnClearData.addEventListener('click', handleClearData);
    }
    if (els.btnBackToHome) {
      els.btnBackToHome.addEventListener('click', () => {
        if (window.HydrationApp) {
          window.HydrationApp.showView('landing');
        }
      });
    }
  }

  // Open Dashboard if already authenticated; otherwise open Creator Login Modal
  async function openAuthOrDashboard() {
    const token = getAuthToken();
    if (token) {
      // Verify token with backend
      try {
        const res = await fetch('/api/creator/check', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          if (window.HydrationApp) window.HydrationApp.showView('dashboard');
          await fetchAndRenderData();
          return;
        }
      } catch (e) {
        // Token invalid or network issue
      }
      setAuthToken(null);
    }
    openAuthModal();
  }

  function openAuthModal() {
    if (!els.creatorAuthModal) return;
    hideAuthError();
    if (els.creatorUsername) els.creatorUsername.value = '';
    if (els.creatorPassword) els.creatorPassword.value = '';
    els.creatorAuthModal.classList.remove('hidden');
    setTimeout(() => {
      if (els.creatorUsername) els.creatorUsername.focus();
    }, 100);
  }

  function closeAuthModal() {
    if (els.creatorAuthModal) {
      els.creatorAuthModal.classList.add('hidden');
    }
  }

  function showAuthError(msg) {
    if (els.authErrorMessage) {
      els.authErrorMessage.textContent = msg;
      els.authErrorMessage.classList.remove('hidden');
    }
  }

  function hideAuthError() {
    if (els.authErrorMessage) {
      els.authErrorMessage.classList.add('hidden');
      els.authErrorMessage.textContent = '';
    }
  }

  // Submit Login Credentials
  async function handleLoginSubmit(e) {
    e.preventDefault();
    hideAuthError();

    const username = (els.creatorUsername.value || '').trim();
    const password = (els.creatorPassword.value || '').trim();

    if (!username || !password) {
      showAuthError('Please enter both username and password.');
      return;
    }

    const submitBtn = document.getElementById('btnSubmitAuth');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying...</span>';
    }

    try {
      const res = await fetch('/api/creator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setAuthToken(data.token);
        closeAuthModal();
        if (window.HydrationApp) {
          window.HydrationApp.showView('dashboard');
        }
        await fetchAndRenderData();
      } else {
        showAuthError(data.error || 'Invalid credentials. Access denied.');
      }
    } catch (err) {
      showAuthError('Connection error. Could not reach authentication server.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  // Logout Creator Session
  async function handleLogout() {
    const token = getAuthToken();
    if (token) {
      try {
        await fetch('/api/creator/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        // Ignore network errors on logout
      }
    }
    setAuthToken(null);
    responsesData = [];
    filteredData = [];
    if (window.HydrationApp) {
      window.HydrationApp.showView('landing');
    }
  }

  // Fetch responses from authenticated server endpoint
  async function fetchAndRenderData() {
    const token = getAuthToken();
    if (!token) {
      openAuthModal();
      return;
    }

    try {
      const res = await fetch('/api/responses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        setAuthToken(null);
        openAuthModal();
        showAuthError('Session expired or unauthorized. Please re-authenticate.');
        return;
      }

      if (res.ok) {
        const payload = await res.json();
        responsesData = payload.responses || [];
      } else {
        throw new Error('Server returned error status ' + res.status);
      }
    } catch (e) {
      console.warn('Error fetching responses collection:', e);
      responsesData = [];
    }

    filteredData = [...responsesData];
    renderDashboard();
  }

  // Render KPIs, Distribution, and Table
  function renderDashboard() {
    renderKPIs();
    renderDistribution();
    renderTraitAverages();
    renderTable();
  }

  // Render Key Performance Indicators
  function renderKPIs() {
    const total = responsesData.length;
    if (els.totalResponsesCount) els.totalResponsesCount.textContent = total;

    if (total === 0) {
      if (els.topPersonalityBadge) els.topPersonalityBadge.textContent = 'None yet';
      if (els.avgIntakeVal) els.avgIntakeVal.textContent = '—';
      if (els.avgScoreVal) els.avgScoreVal.textContent = '—';
      return;
    }

    // Top personality
    const counts = {};
    let totalScore = 0;
    responsesData.forEach(r => {
      const p = r.personalityName || r.personalityId || 'Unknown';
      counts[p] = (counts[p] || 0) + 1;
      totalScore += parseFloat(r.totalScore || 0);
    });

    let topName = '';
    let topCount = -1;
    for (const [name, count] of Object.entries(counts)) {
      if (count > topCount) {
        topCount = count;
        topName = name;
      }
    }

    if (els.topPersonalityBadge) {
      els.topPersonalityBadge.textContent = `${topName} (${Math.round((topCount / total) * 100)}%)`;
    }
    if (els.avgScoreVal) {
      els.avgScoreVal.textContent = `${(totalScore / total).toFixed(1)} / 10`;
    }
    if (els.avgIntakeVal) {
      const intakeCounts = {};
      responsesData.forEach(r => {
        const q1 = (r.answers && r.answers.q1) || '3-4';
        intakeCounts[q1] = (intakeCounts[q1] || 0) + 1;
      });
      let topIntake = '5-6 glasses';
      let maxI = 0;
      for (const [i, c] of Object.entries(intakeCounts)) {
        if (c > maxI) { maxI = c; topIntake = `${i} glasses`; }
      }
      els.avgIntakeVal.textContent = topIntake;
    }
  }

  // Render Distribution Bar Chart for 5 personalities
  function renderDistribution() {
    if (!els.distBarsContainer) return;

    const personalities = [
      { id: 'cactus', name: 'The Cactus', emoji: '🌵', color: '#D97706' },
      { id: 'casual_sipper', name: 'The Casual Sipper', emoji: '🐈', color: '#0284C7' },
      { id: 'steady_turtle', name: 'The Steady Turtle', emoji: '🐢', color: '#0D9488' },
      { id: 'happy_dolphin', name: 'The Happy Dolphin', emoji: '🐬', color: '#06B6D4' },
      { id: 'water_whale', name: 'The Water Whale', emoji: '🐋', color: '#2563EB' }
    ];

    const total = responsesData.length;
    const counts = {};
    personalities.forEach(p => counts[p.id] = 0);

    responsesData.forEach(r => {
      const pId = r.personalityId;
      if (counts[pId] !== undefined) {
        counts[pId]++;
      }
    });

    els.distBarsContainer.innerHTML = personalities.map(p => {
      const count = counts[p.id];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return `
        <div class="dist-bar-row">
          <div class="dist-name"><span>${p.emoji}</span> <span>${p.name}</span></div>
          <div class="dist-bar-track">
            <div class="dist-bar-val" style="width: ${pct}%; background-color: ${p.color};"></div>
          </div>
          <div class="dist-count">${count} <span style="font-size: 0.72rem; color: var(--text-muted);">(${pct}%)</span></div>
        </div>
      `;
    }).join('');
  }

  // Render Trait Averages Metric Bars
  function renderTraitAverages() {
    if (!els.traitAveragesContainer) return;
    const total = responsesData.length;
    const traits = { volume: 0, consistency: 0, timing: 0, awareness: 0, habit: 0 };

    if (total > 0) {
      responsesData.forEach(r => {
        const t = r.traits || {};
        for (const k in traits) {
          traits[k] += t[k] || 50;
        }
      });
      for (const k in traits) {
        traits[k] = Math.round(traits[k] / total);
      }
    }

    const traitLabels = [
      { key: 'volume', label: 'Volume (Hydration Amount)', icon: '🌊' },
      { key: 'consistency', label: 'Consistency (Throughout Day)', icon: '⏳' },
      { key: 'timing', label: 'Timing (Morning Wakeup & Rhythm)', icon: '⏰' },
      { key: 'awareness', label: 'Awareness (Listening to Body)', icon: '🧠' },
      { key: 'habit', label: 'Habit (Bottle Carrying & Reflexes)', icon: '🎒' }
    ];

    els.traitAveragesContainer.innerHTML = traitLabels.map(t => {
      const val = traits[t.key];
      return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
            <span>${t.icon} ${t.label}</span>
            <span style="color: var(--primary-teal); font-weight: 800;">${val}%</span>
          </div>
          <div style="height: 8px; background: var(--cream-soft); border-radius: 4px; overflow: hidden; border: 1px solid var(--card-border);">
            <div style="height: 100%; width: ${val}%; background: linear-gradient(90deg, #2EC4B6, #028090); border-radius: 4px; transition: width 0.4s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Filter & Search Table
  function applyFilters() {
    const query = (els.searchInput ? els.searchInput.value : '').toLowerCase().trim();
    const personalityFilter = els.filterPersonality ? els.filterPersonality.value : 'all';

    filteredData = responsesData.filter(r => {
      // Filter by personality dropdown
      if (personalityFilter !== 'all' && r.personalityId !== personalityFilter) {
        return false;
      }
      // Search by text query
      if (!query) return true;
      const haystack = [
        r.userName || '',
        r.id || '',
        r.personalityName || '',
        r.emoji || '',
        r.createdAt || '',
        (r.answers && r.answers.q1) || ''
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });

    renderTable();
  }

  // Render Table
  function renderTable() {
    if (!els.responsesTableBody) return;

    if (els.tableCountSummary) {
      els.tableCountSummary.textContent = `Showing ${filteredData.length} of ${responsesData.length} responses`;
    }

    if (filteredData.length === 0) {
      els.responsesTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
            No hydration responses found matching your query.
          </td>
        </tr>
      `;
      return;
    }

    const rows = filteredData.map(r => {
      const dateStr = formatDate(r.createdAt);
      const traits = r.traits || {};
      const answers = r.answers || {};

      const pColors = {
        cactus: 'background: #FEF3C7; color: #92400E;',
        casual_sipper: 'background: #E0F2FE; color: #0369A1;',
        steady_turtle: 'background: #CCFBF1; color: #0F766E;',
        happy_dolphin: 'background: #CFFAFE; color: #0E7490;',
        water_whale: 'background: #DBEAFE; color: #1E40AF;'
      };
      const badgeStyle = pColors[r.personalityId] || 'background: #F1F5F9; color: #334155;';

      return `
        <tr>
          <td>
            <strong style="color: var(--primary-teal); font-size: 0.92rem;">
              👤 ${escapeHtml(r.userName || 'Anonymous')}
            </strong>
          </td>
          <td style="font-family: monospace; font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">
            ${escapeHtml(r.id || '—')}
          </td>
          <td>${dateStr}</td>
          <td>
            <span class="table-badge" style="${badgeStyle}">
              <span>${r.emoji || '💧'}</span> <span>${escapeHtml(r.personalityName || 'Unknown')}</span>
            </span>
          </td>
          <td style="font-weight: 700; color: var(--primary-teal);">
            ${r.totalScore ? `${r.totalScore} / 10` : '—'}
          </td>
          <td>
            <span style="font-weight: 600;">${escapeHtml(answers.q1 || '3-4')} glasses</span>
          </td>
          <td>
            <div style="font-size: 0.78rem; display: flex; gap: 6px; flex-wrap: wrap;">
              <span title="Volume">Vol: <strong>${traits.volume || 50}%</strong></span> •
              <span title="Consistency">Con: <strong>${traits.consistency || 50}%</strong></span> •
              <span title="Timing">Tim: <strong>${traits.timing || 50}%</strong></span> •
              <span title="Habit">Hab: <strong>${traits.habit || 50}%</strong></span>
            </div>
          </td>
          <td>
            <button class="nav-btn btn-view-row" style="padding: 3px 8px; font-size: 0.75rem;" data-id="${r.id}">
              Inspect
            </button>
          </td>
        </tr>
      `;
    }).join('');

    els.responsesTableBody.innerHTML = rows;

    // Attach inspect buttons
    els.responsesTableBody.querySelectorAll('.btn-view-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = responsesData.find(x => x.id === btn.dataset.id);
        if (item) {
          inspectResponseModal(item);
        }
      });
    });
  }

  // Inspect Response Details Popup
  function inspectResponseModal(item) {
    const answers = item.answers || {};
    const traits = item.traits || {};
    const modalHtml = `
      <div id="inspectModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
        <div style="background: var(--card-bg); border: 2px solid var(--card-border); border-radius: 20px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 2rem;">${item.emoji}</span>
              <div>
                <h3 style="margin: 0; font-size: 1.25rem;">${escapeHtml(item.personalityName)}</h3>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${formatDate(item.createdAt)}</span>
              </div>
            </div>
            <button id="closeModalBtn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
          </div>

          <div style="background: var(--cream-soft); padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 0.88rem;">
            <div><strong>Participant Name:</strong> <span style="color: var(--primary-teal); font-weight: 700;">${escapeHtml(item.userName || 'Anonymous')}</span></div>
            <div><strong>Overall Score:</strong> ${item.totalScore} / 10</div>
            <div><strong>Daily Water Intake:</strong> ${answers.q1 || '3-4'} glasses/day</div>
            <div><strong>Time Taken:</strong> ${(item.metadata && item.metadata.timeTakenSec) || '—'} seconds</div>
          </div>

          <h4 style="margin: 0 0 8px; font-size: 0.95rem;">Hydration Traits</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 0.82rem;">
            <div style="padding: 8px; background: var(--cream-soft); border-radius: 8px;">Volume: <strong>${traits.volume}%</strong></div>
            <div style="padding: 8px; background: var(--cream-soft); border-radius: 8px;">Consistency: <strong>${traits.consistency}%</strong></div>
            <div style="padding: 8px; background: var(--cream-soft); border-radius: 8px;">Timing: <strong>${traits.timing}%</strong></div>
            <div style="padding: 8px; background: var(--cream-soft); border-radius: 8px;">Awareness: <strong>${traits.awareness}%</strong></div>
            <div style="padding: 8px; background: var(--cream-soft); border-radius: 8px; grid-column: span 2;">Habit: <strong>${traits.habit}%</strong></div>
          </div>

          <h4 style="margin: 0 0 8px; font-size: 0.95rem;">Question Answers (1 to 7 Scale)</h4>
          <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.6;">
            <div>• Q1 (Typical daily water glasses): <strong>${answers.q1 || '—'}</strong></div>
            <div>• Q2 (First drink after wake up): <strong>${answers.q2 || '—'} / 7</strong></div>
            <div>• Q3 (Carry water bottle everywhere): <strong>${answers.q3 || '—'} / 7</strong></div>
            <div>• Q4 (Respond immediately to thirst): <strong>${answers.q4 || '—'} / 7</strong></div>
            <div>• Q5 (Drink water during meals): <strong>${answers.q5 || '—'} / 7</strong></div>
            <div>• Q6 (Intake on busy deadline days): <strong>${answers.q6 || '—'} / 7</strong></div>
            <div>• Q7 (Friends call you 'the hydrated one'): <strong>${answers.q7 || '—'} / 7</strong></div>
          </div>

          <div style="margin-top: 20px; text-align: right;">
            <button id="modalDoneBtn" class="btn-primary" style="padding: 8px 20px; font-size: 0.9rem; max-width: 140px;">Close</button>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = modalHtml;
    document.body.appendChild(container);

    const close = () => {
      if (container.parentNode) container.parentNode.removeChild(container);
    };

    container.querySelector('#closeModalBtn').addEventListener('click', close);
    container.querySelector('#modalDoneBtn').addEventListener('click', close);
    container.querySelector('#inspectModal').addEventListener('click', (e) => {
      if (e.target.id === 'inspectModal') close();
    });
  }

  // Handle Export CSV (Authorized URL download with token parameter)
  function handleExportCsv() {
    const token = getAuthToken();
    if (!token) {
      openAuthModal();
      return;
    }
    window.location.href = `/api/export-csv?token=${encodeURIComponent(token)}`;
  }

  // Handle Export JSON
  function handleExportJson() {
    const jsonStr = JSON.stringify(responsesData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydration_quiz_responses_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Seed sample responses (Authorized)
  async function handleSeedDemo() {
    const token = getAuthToken();
    if (!token) {
      openAuthModal();
      return;
    }
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchAndRenderData();
      }
    } catch (e) {
      alert('Could not seed demo data: ' + e.message);
    }
  }

  // Clear data (Authorized)
  async function handleClearData() {
    const token = getAuthToken();
    if (!token) {
      openAuthModal();
      return;
    }

    if (!confirm('Are you sure you want to clear all collected hydration responses? This cannot be undone.')) {
      return;
    }
    try {
      await fetch('/api/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      // Ignore network errors
    }
    responsesData = [];
    filteredData = [];
    renderDashboard();
  }

  // Helper: Format Date
  function formatDate(isoStr) {
    if (!isoStr) return 'Just now';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  }

  // Helper: Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Public Interface
  window.HydrationDashboard = {
    init: initDashboard,
    refresh: fetchAndRenderData,
    openAuthOrDashboard: openAuthOrDashboard
  };

  document.addEventListener('DOMContentLoaded', initDashboard);
})();
