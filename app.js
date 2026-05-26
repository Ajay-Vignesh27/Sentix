/**
 * Sentix Main Application Controller
 */

// ==================================================
// Sentix Sentiment Lexicon Engine (Inline Self-Contained)
// ==================================================
const SENTIMENT_LEXICON = {
  // Positive words
  'love': 4, 'loved': 4, 'loves': 4, 'loving': 4, 'excellent': 4, 'outstanding': 4,
  'awesome': 4, 'amazing': 4, 'wonderful': 4, 'fantastic': 4, 'beautiful': 3,
  'great': 3, 'good': 2, 'best': 3, 'superb': 3, 'perfect': 4, 'perfectly': 4,
  'smooth': 3, 'smoothly': 3, 'intuitive': 3, 'intuitively': 3, 'easy': 2, 'easily': 2,
  'friendly': 2, 'helpful': 2, 'help': 2, 'helped': 2, 'happy': 3, 'glad': 2,
  'satisfied': 3, 'satisfactory': 2, 'appreciate': 2, 'appreciated': 2, 'like': 2, 'liked': 2,
  'likes': 2, 'recommend': 3, 'recommended': 3, 'fast': 2, 'quick': 2, 'quickly': 2,
  'efficient': 3, 'efficiently': 3, 'solved': 2, 'resolves': 2, 'resolved': 2, 'redesign': 2,
  'exceeded': 3, 'exceed': 3, 'pleased': 3, 'favorite': 3, 'useful': 2, 'valuable': 3,
  'smart': 2, 'brilliant': 4, 'innovative': 3, 'clean': 2, 'nice': 2, 'nicely': 2,
  'fine': 1, 'ok': 1, 'okay': 1, 'decent': 1, 'worth': 2,

  // Negative words
  'hate': -4, 'hated': -4, 'hating': -4, 'terrible': -4, 'terribly': -4, 'awful': -4,
  'horrible': -4, 'horribly': -4, 'worst': -4, 'bad': -3, 'badly': -3, 'poor': -3,
  'poorly': -3, 'slow': -2, 'slowly': -2, 'broken': -3, 'broke': -2, 'break': -2,
  'fail': -2, 'failed': -3, 'failing': -2, 'failure': -3, 'useless': -4, 'waste': -3,
  'wasted': -3, 'frustrated': -3, 'frustrating': -3, 'annoyed': -2, 'annoying': -2,
  'disappointed': -3, 'disappointing': -3, 'disappointment': -3, 'hate': -4, 'wait': -1,
  'waiting': -2, 'waited': -1, 'delay': -2, 'delayed': -2, 'expensive': -2, 'overpriced': -2,
  'bug': -2, 'bugs': -2, 'buggy': -3, 'crash': -3, 'crashed': -3, 'crashes': -3,
  'error': -2, 'errors': -2, 'issue': -1, 'issues': -2, 'difficult': -2, 'difficulty': -2,
  'confusing': -2, 'confused': -1, 'hard': -1, 'pain': -2, 'painful': -3, 'refund': -1,
  'refunds': -1, 'ticket': 0, 'tickets': 0, 'urgent': -1, 'unhappy': -3, 'ruined': -3,
  'mess': -2, 'garbage': -3, 'trash': -3, 'clunky': -2, 'slowdown': -2, 'freeze': -2,
  'frozen': -3, 'complaint': -2, 'complaints': -2, 'complain': -2, 'ignored': -3,
  'ignore': -2, 'useless': -3, 'worst': -4, 'lacking': -2, 'lack': -1, 'missing': -1
};

const NEGATION_WORDS = [
  'not', 'no', 'never', 'don\'t', 'dont', 'cannot', 'cant', 'can\'t',
  'wasn't', 'wasnt', 'isn\'t', 'isnt', 'won\'t', 'wont', 'couldn\'t', 'couldnt',
  'wouldn\'t', 'wouldnt', 'shouldn\'t', 'shouldnt', 'haven\'t', 'havent',
  'hadn\'t', 'hadnt', 'neither', 'nor'
];

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

function analyzeComment(commentText) {
  if (!commentText || !commentText.trim()) {
    return {
      comment: '',
      sentiment: 'Neutral',
      confidence: 70,
      reason: 'Empty text provided.',
      matchedPositive: [],
      matchedNegative: []
    };
  }

  const tokens = tokenize(commentText);
  let totalScore = 0;
  const matchedPositive = [];
  const matchedNegative = [];
  
  let isNegated = false;
  let negationDistance = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (NEGATION_WORDS.includes(token)) {
      isNegated = true;
      negationDistance = 0;
      continue;
    }

    if (isNegated) {
      negationDistance++;
      if (negationDistance > 3) {
        isNegated = false;
      }
    }

    if (token in SENTIMENT_LEXICON) {
      let score = SENTIMENT_LEXICON[token];

      if (isNegated) {
        score = -score * 0.75;
        isNegated = false;
      }

      totalScore += score;

      if (score > 0) {
        if (!matchedPositive.includes(token)) {
          matchedPositive.push(token);
        }
      } else if (score < 0) {
        if (!matchedNegative.includes(token)) {
          matchedNegative.push(token);
        }
      }
    }
  }

  let sentiment = 'Neutral';
  if (totalScore > 0.2) {
    sentiment = 'Positive';
  } else if (totalScore < -0.2) {
    sentiment = 'Negative';
  }

  let confidence = 70;
  const absScore = Math.abs(totalScore);

  if (sentiment !== 'Neutral') {
    confidence = Math.min(98, Math.round(70 + (absScore * 7)));
  } else {
    if (matchedPositive.length > 0 && matchedNegative.length > 0) {
      confidence = 55;
    } else if (matchedPositive.length === 0 && matchedNegative.length === 0) {
      confidence = 75;
    } else {
      confidence = 65;
    }
  }

  let reason = '';
  if (sentiment === 'Positive') {
    const wordList = matchedPositive.map(w => `'${w}'`).join(', ');
    if (matchedNegative.length > 0) {
      const negList = matchedNegative.map(w => `'${w}'`).join(', ');
      reason = `Positive overall (score +${totalScore.toFixed(1)}). Matched positive terms [${wordList}] outweighing negative terms [${negList}].`;
    } else {
      reason = `Identified positive indicators: [${wordList}]. Total score +${totalScore.toFixed(1)}.`;
    }
  } else if (sentiment === 'Negative') {
    const wordList = matchedNegative.map(w => `'${w}'`).join(', ');
    if (matchedPositive.length > 0) {
      const posList = matchedPositive.map(w => `'${w}'`).join(', ');
      reason = `Negative overall (score ${totalScore.toFixed(1)}). Matched negative terms [${wordList}] outweighing positive terms [${posList}].`;
    } else {
      reason = `Identified negative indicators: [${wordList}]. Total score ${totalScore.toFixed(1)}.`;
    }
  } else {
    if (matchedPositive.length > 0 && matchedNegative.length > 0) {
      reason = `Conflict analysis: Neutral balance. Positive indicators [${matchedPositive.map(w=>`'${w}'`).join(', ')}] canceled out by negative indicators [${matchedNegative.map(w=>`'${w}'`).join(', ')}].`;
    } else {
      reason = `Neutral analysis: No significant sentiment-bearing words detected in the comment.`;
    }
  }

  return {
    comment: commentText,
    sentiment,
    confidence,
    reason,
    matchedPositive,
    matchedNegative
  };
}

// Bind globally for preview tools
if (typeof window !== 'undefined') {
  window.analyzeComment = analyzeComment;
  window.tokenize = tokenize;
}


// Global State
let currentBatchData = [];
let currentBatchId = null;
let currentBatchName = '';
let currentScreen = 'empty';
let donutChartInstance = null;
let confChartInstance = null;

// DOM Announcer for screen readers (Accessibility)
function announce(message) {
  const announcer = document.getElementById('sr-announcer');
  if (announcer) {
    announcer.textContent = message;
  }
}

// 1. Screen Router
function goScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  
  // Show target screen
  const target = document.getElementById('screen-' + screenId);
  if (target) {
    target.classList.add('active');
    currentScreen = screenId;
    announce(`Navigated to ${screenId} screen.`);
  }

  // Update navigation links active states
  document.querySelectorAll('.nav-link[id]').forEach(link => link.classList.remove('active'));
  if (['input', 'processing', 'results', 'detail'].includes(screenId)) {
    document.getElementById('nav-analyze').classList.add('active');
  }
  if (screenId === 'history') {
    document.getElementById('nav-history').classList.add('active');
  }

  // Initialize specific screens
  if (screenId === 'results') {
    initResultsScreen();
  } else if (screenId === 'processing') {
    startFakeProgress();
  } else if (screenId === 'history') {
    loadAndRenderHistory();
  }
}

// 2. Sentiment Engine Integration
function runAnalysisOnText(text) {
  // Split by newlines, filter empty lines
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    alert('Please enter at least one comment to analyze.');
    goScreen('input');
    return;
  }

  // Run sentiment analysis on each line
  const results = lines.map(line => {
    // Call function from sentiment.js
    if (typeof analyzeComment === 'function') {
      return analyzeComment(line);
    } else {
      // Mock fallback if running in context without script loaded
      return { comment: line, sentiment: 'Neutral', confidence: 70, reason: 'Sentiment engine not found.', matchedPositive: [], matchedNegative: [] };
    }
  });

  currentBatchData = results;
  currentBatchId = Date.now().toString();
  currentBatchName = `Text Batch #${Math.floor(Math.random() * 900 + 100)}`;
  
  // Save run to local history
  saveBatchToHistory(currentBatchId, currentBatchName, currentBatchData);
}

// 3. Fake Progress Simulation
let progressInterval = null;
function startFakeProgress() {
  const progressBar = document.getElementById('progBar');
  const progLabel = document.getElementById('progLabel');
  const progEta = document.getElementById('progEta');
  const cancelBtn = document.querySelector('#screen-processing .btn-cancel');

  let pct = 0;
  progressBar.style.width = '0%';
  progLabel.textContent = 'Preparing comments...';
  progEta.textContent = 'Calculating time...';

  const stages = [
    { threshold: 25, label: 'Reading raw data inputs...', eta: 'Calculating...' },
    { threshold: 50, label: 'Parsing strings and tokens...', eta: '~3s remaining' },
    { threshold: 75, label: 'Running lexicon analysis...', eta: '~2s remaining' },
    { threshold: 95, label: 'Compiling results and confidence...', eta: '~1s remaining' },
    { threshold: 100, label: 'Finalizing charts and dashboard...', eta: 'Almost done' }
  ];

  if (progressInterval) clearInterval(progressInterval);

  progressInterval = setInterval(() => {
    pct += Math.floor(Math.random() * 8 + 4);
    if (pct > 100) pct = 100;

    progressBar.style.width = pct + '%';

    // Update label based on stage
    const currentStage = stages.find(s => pct <= s.threshold) || stages[stages.length - 1];
    progLabel.textContent = currentStage.label;
    progEta.textContent = currentStage.eta;

    if (pct >= 100) {
      clearInterval(progressInterval);
      // Run the actual analysis now
      const textareaVal = document.getElementById('demoTextarea').value;
      runAnalysisOnText(textareaVal);
      goScreen('results');
    }
  }, 100);
}

// 4. Results Screen & Chart.js Config
function initResultsScreen() {
  // Update header title
  const header = document.querySelector('#screen-results h2');
  if (header) {
    header.innerHTML = `<i class="ti ti-chart-bar" aria-hidden="true" style="font-size:16px;vertical-align:-2px;margin-right:6px"></i>Results — ${currentBatchName}`;
  }

  // Calculate Metrics
  const total = currentBatchData.length;
  const posCount = currentBatchData.filter(d => d.sentiment === 'Positive').length;
  const negCount = currentBatchData.filter(d => d.sentiment === 'Negative').length;
  const neuCount = currentBatchData.filter(d => d.sentiment === 'Neutral').length;

  const posPct = total > 0 ? Math.round((posCount / total) * 100) : 0;
  const negPct = total > 0 ? Math.round((negCount / total) * 100) : 0;
  const neuPct = total > 0 ? Math.round((neuCount / total) * 100) : 0;

  // Render cards
  document.getElementById('m-total').textContent = total;
  document.getElementById('m-pos').textContent = posCount;
  document.getElementById('m-pos-pct').textContent = `${posPct}%`;
  document.getElementById('m-neg').textContent = negCount;
  document.getElementById('m-neg-pct').textContent = `${negPct}%`;
  document.getElementById('m-neu').textContent = neuCount;
  document.getElementById('m-neu-pct').textContent = `${neuPct}%`;

  // Draw Charts
  drawCharts(posCount, negCount, neuCount);

  // Render Data Table
  filterTable();
}

function drawCharts(pos, neg, neu) {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js is not loaded. Skipping chart rendering.');
    return;
  }

  // Clean old charts if they exist
  if (donutChartInstance) donutChartInstance.destroy();
  if (confChartInstance) confChartInstance.destroy();

  const total = pos + neg + neu;
  const posPct = total > 0 ? Math.round((pos / total) * 100) : 0;
  const negPct = total > 0 ? Math.round((neg / total) * 100) : 0;
  const neuPct = total > 0 ? Math.round((neu / total) * 100) : 0;

  // 1. Donut Chart
  const donutCtx = document.getElementById('donutChart');
  if (donutCtx) {
    // Update legend UI text manually to correspond to data
    const chartCard = donutCtx.closest('.chart-card');
    if (chartCard) {
      const legendItems = chartCard.querySelectorAll('.legend-item');
      if (legendItems.length >= 3) {
        legendItems[0].innerHTML = `<span class="legend-dot" style="background:#1D9E75"></span>Positive ${posPct}% (${pos})`;
        legendItems[1].innerHTML = `<span class="legend-dot" style="background:#D85A30"></span>Negative ${negPct}% (${neg})`;
        legendItems[2].innerHTML = `<span class="legend-dot" style="background:#888780"></span>Neutral ${neuPct}% (${neu})`;
      }
    }

    donutChartInstance = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
          data: [pos, neg, neu],
          backgroundColor: ['#1D9E75', '#D85A30', '#888780'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.label}: ${c.raw} comments (${Math.round((c.raw/total)*100)}%)`
            }
          }
        }
      }
    });
  }

  // 2. Confidence Distribution Bar Chart (aggregating confidence into score brackets)
  const confCtx = document.getElementById('confChart');
  if (confCtx) {
    const brackets = { '50-60%': 0, '60-70%': 0, '70-80%': 0, '80-90%': 0, '90-100%': 0 };
    currentBatchData.forEach(d => {
      const conf = d.confidence;
      if (conf >= 90) brackets['90-100%']++;
      else if (conf >= 80) brackets['80-90%']++;
      else if (conf >= 70) brackets['70-80%']++;
      else if (conf >= 60) brackets['60-70%']++;
      else brackets['50-60%']++;
    });

    confChartInstance = new Chart(confCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(brackets),
        datasets: [{
          data: Object.values(brackets),
          backgroundColor: '#1D9E75',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: 'var(--color-text-secondary)', font: { family: 'inherit', size: 11 } } },
          y: { 
            min: 0, 
            grid: { color: 'rgba(136, 135, 128, 0.12)' }, 
            ticks: { 
              stepSize: 1, 
              color: 'var(--color-text-secondary)',
              font: { family: 'inherit', size: 11 }
            } 
          }
        }
      }
    });
  }
}

// 5. Results Table Handling & Filtering
function filterTable() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filterVal = document.getElementById('filterSel').value;

  const filtered = currentBatchData.filter(d => {
    const matchesQuery = !query || d.comment.toLowerCase().includes(query) || d.reason.toLowerCase().includes(query);
    const matchesFilter = !filterVal || d.sentiment === filterVal;
    return matchesQuery && matchesFilter;
  });

  renderTable(filtered);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTable(data) {
  const body = document.getElementById('resultsBody');
  if (!body) return;

  if (data.length === 0) {
    body.innerHTML = `<tr>
      <td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-tertiary)">
        <i class="ti ti-ban" style="font-size:24px;display:block;margin-bottom:8px"></i>
        No matching comments found
      </td>
    </tr>`;
    return;
  }

  body.innerHTML = data.map((d) => {
    const originalIndex = currentBatchData.indexOf(d);
    const cls = d.sentiment === 'Positive' ? 'pos' : d.sentiment === 'Negative' ? 'neg' : 'neu';
    const icon = d.sentiment === 'Positive' ? 'ti-mood-happy' : d.sentiment === 'Negative' ? 'ti-mood-sad' : 'ti-mood-neutral';
    const isOverridden = d.isOverridden ? ' <span style="font-size:9px;color:var(--color-text-tertiary)">(Edited)</span>' : '';
    
    return `<tr>
      <td style="color:var(--color-text-tertiary);font-size:12px">${originalIndex + 1}</td>
      <td style="font-size:13px;word-break:break-word">${esc(d.comment)}</td>
      <td>
        <span class="badge badge-${cls}">
          <i class="ti ${icon}" aria-hidden="true" style="font-size:12px"></i>
          ${d.sentiment}
        </span>
        ${isOverridden}
      </td>
      <td>
        <div class="conf-bar-wrap" aria-label="Confidence: ${d.confidence}%">
          <div class="conf-bar"><div class="conf-fill conf-${cls}" style="width:${d.confidence}%"></div></div>
          <span class="conf-pct">${d.confidence}%</span>
        </div>
      </td>
      <td class="reason-cell" title="${esc(d.reason)}">${esc(d.reason)}</td>
      <td>
        <button onclick="openDetail(${originalIndex})" class="action-btn" aria-label="Open detailed drawer for comment ${originalIndex + 1}">
          <i class="ti ti-chevron-right" aria-hidden="true"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

// 6. Detail Drawer & Sentiment Override
let activeDetailIdx = null;
function openDetail(idx) {
  activeDetailIdx = idx;
  const d = currentBatchData[idx];

  // Render Highlighted Comment Text
  let html = esc(d.comment);

  // Safe whole-word matching using word boundaries
  d.matchedPositive.forEach(w => {
    const escapedWord = w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
    html = html.replace(regex, `<span class="highlight-pos">$1</span>`);
  });

  d.matchedNegative.forEach(w => {
    const escapedWord = w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
    html = html.replace(regex, `<span class="highlight-neg">$1</span>`);
  });

  document.getElementById('detail-comment').innerHTML = html;

  // Class badge mapping
  const cls = d.sentiment === 'Positive' ? 'pos' : d.sentiment === 'Negative' ? 'neg' : 'neu';
  document.getElementById('detail-sentiment').innerHTML = `<span class="badge badge-${cls}">${d.sentiment}</span>`;
  document.getElementById('detail-conf').textContent = d.confidence + '%';
  document.getElementById('detail-idx').textContent = '#' + (idx + 1);
  document.getElementById('detail-reason').textContent = d.reason;

  // Enable/Disable action states in Edit Mode
  updateOverrideButtons(d.sentiment);

  goScreen('detail');
}

function updateOverrideButtons(activeSentiment) {
  const container = document.getElementById('override-actions');
  if (!container) return;

  // Clear previous overrides controls
  container.innerHTML = `
    <span style="font-size:12px;color:var(--color-text-secondary);font-weight:500">Correct AI Sentiment:</span>
    <button class="btn-outline btn-override-pos ${activeSentiment === 'Positive' ? 'active' : ''}" onclick="overrideSentiment('Positive')">
      <i class="ti ti-mood-happy"></i> Positive
    </button>
    <button class="btn-outline btn-override-neu ${activeSentiment === 'Neutral' ? 'active' : ''}" onclick="overrideSentiment('Neutral')">
      <i class="ti ti-mood-neutral"></i> Neutral
    </button>
    <button class="btn-outline btn-override-neg ${activeSentiment === 'Negative' ? 'active' : ''}" onclick="overrideSentiment('Negative')">
      <i class="ti ti-mood-sad"></i> Negative
    </button>
  `;
}

function overrideSentiment(newSentiment) {
  if (activeDetailIdx === null) return;

  const item = currentBatchData[activeDetailIdx];
  const oldSentiment = item.sentiment;

  if (oldSentiment === newSentiment) return;

  // Apply Manual Override
  item.sentiment = newSentiment;
  item.confidence = 100; // Manual edits are absolute (100% confidence)
  item.reason = `Manual override: User corrected sentiment from '${oldSentiment}' to '${newSentiment}'.`;
  item.isOverridden = true;

  // Sync to local history database
  saveBatchToHistory(currentBatchId, currentBatchName, currentBatchData);

  // Show status success toast
  showToast(`Sentiment corrected to ${newSentiment}!`);

  // Reload drawer and results UI
  openDetail(activeDetailIdx);
}

// 7. LocalStorage History Logs Management
function getHistory() {
  try {
    const raw = localStorage.getItem('sentix_history');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read localStorage history:', e);
    return [];
  }
}

function saveBatchToHistory(id, name, data) {
  try {
    const history = getHistory();
    const existingIndex = history.findIndex(h => h.id === id);

    // Calculate dominant sentiment
    const pos = data.filter(d => d.sentiment === 'Positive').length;
    const neg = data.filter(d => d.sentiment === 'Negative').length;
    const neu = data.filter(d => d.sentiment === 'Neutral').length;
    let dominant = 'Neutral';
    if (pos > neg && pos > neu) dominant = 'Positive';
    if (neg > pos && neg > neu) dominant = 'Negative';

    const batchRecord = {
      id,
      name,
      date: existingIndex >= 0 ? history[existingIndex].date : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      count: data.length,
      dominant,
      pos,
      neg,
      neu,
      data
    };

    if (existingIndex >= 0) {
      history[existingIndex] = batchRecord; // update existing batch
    } else {
      history.unshift(batchRecord); // insert at top
    }

    localStorage.setItem('sentix_history', JSON.stringify(history));
  } catch (e) {
    console.error('Failed to write local database:', e);
  }
}

function deleteBatch(id, event) {
  if (event) event.stopPropagation(); // prevent loading batch
  
  if (!confirm('Are you sure you want to delete this historical analysis run?')) return;

  try {
    let history = getHistory();
    history = history.filter(h => h.id !== id);
    localStorage.setItem('sentix_history', JSON.stringify(history));
    
    showToast('Batch removed from history.');
    loadAndRenderHistory();
  } catch (e) {
    console.error('Failed to delete history batch:', e);
  }
}

function loadAndRenderHistory() {
  const history = getHistory();
  renderHistoryList(history);
}

function renderHistoryList(data) {
  const container = document.getElementById('historyList');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 24px;background:var(--color-background-secondary);border-radius:var(--border-radius-lg);border:0.5px solid var(--color-border-tertiary)">
        <i class="ti ti-history" style="font-size:36px;color:var(--color-text-tertiary);display:block;margin-bottom:12px"></i>
        <h3 style="font-size:15px;font-weight:500;margin-bottom:4px">No analysis history</h3>
        <p style="color:var(--color-text-secondary);font-size:13px">Run sentiment analyses to build your logs archive.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = data.map(h => {
    const cls = h.dominant === 'Positive' ? 'pos' : h.dominant === 'Negative' ? 'neg' : 'neu';
    const icon = h.dominant === 'Positive' ? 'ti-mood-happy' : h.dominant === 'Negative' ? 'ti-mood-sad' : 'ti-mood-neutral';
    
    return `<div class="history-item" onclick="loadHistoryBatch('${h.id}')" role="button" tabindex="0" aria-label="Open ${h.name}">
      <div class="hist-icon ${cls}"><i class="ti ${icon}" aria-hidden="true"></i></div>
      <div class="hist-info">
        <div class="hist-name">${esc(h.name)}</div>
        <div class="hist-meta">${h.date} · ${h.count} comments</div>
      </div>
      <div class="hist-badge-wrap">
        <span class="badge badge-pos" style="font-size:10px">${h.pos} pos</span>
        <span class="badge badge-neg" style="font-size:10px">${h.neg} neg</span>
        <span class="badge badge-neu" style="font-size:10px">${h.neu} neu</span>
      </div>
      <button class="action-btn delete-btn" onclick="deleteBatch('${h.id}', event)" aria-label="Delete this history batch" title="Delete run">
        <i class="ti ti-trash"></i>
      </button>
      <i class="ti ti-chevron-right" aria-hidden="true" style="color:var(--color-text-tertiary);font-size:16px;margin-left:8px"></i>
    </div>`;
  }).join('');
}

function loadHistoryBatch(id) {
  const history = getHistory();
  const batch = history.find(h => h.id === id);
  if (!batch) return;

  currentBatchId = batch.id;
  currentBatchName = batch.name;
  currentBatchData = batch.data;

  // Navigate to results
  goScreen('results');
}

function filterHistory(query) {
  const history = getHistory();
  const filtered = history.filter(h => h.name.toLowerCase().includes(query.toLowerCase()));
  renderHistoryList(filtered);
}

// 8. Real CSV File Export
function exportResultsToCSV() {
  if (currentBatchData.length === 0) return;

  // Construct CSV String
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel formatting
  csvContent += 'Index,Comment,Sentiment,Confidence,Reason\n';

  currentBatchData.forEach((row, index) => {
    // Helper to escape double quotes and wrap in quotes
    const cleanComment = `"${row.comment.replace(/"/g, '""')}"`;
    const cleanReason = `"${row.reason.replace(/"/g, '""')}"`;
    csvContent += `${index + 1},${cleanComment},${row.sentiment},${row.confidence}%,${cleanReason}\n`;
  });

  // Trigger Browser Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${currentBatchName.toLowerCase().replace(/\s+/g, '_')}_results.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Results exported to CSV file.');
}

// 9. CSV File Import (Drag & Drop + Input Select)
function parseCSVText(csvText) {
  // Simple robust parser handling quotes and delimiters
  const comments = [];
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i+1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip extra quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // CRLF
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") lines.push(row);

  if (lines.length === 0) return [];

  // Determine text column index (look for headers or pick longest string)
  let textColIdx = 0;
  const headers = lines[0].map(h => h.toLowerCase().trim());
  const sentimentFields = ['comment', 'text', 'feedback', 'review', 'body', 'message'];
  
  const foundIdx = headers.findIndex(h => sentimentFields.includes(h));
  if (foundIdx >= 0) {
    textColIdx = foundIdx;
    lines.shift(); // remove header line
  } else {
    // If no clear headers, guess by inspecting columns of first line
    let maxLen = -1;
    for (let c = 0; c < lines[0].length; c++) {
      if (lines[0][c] && lines[0][c].length > maxLen) {
        maxLen = lines[0][c].length;
        textColIdx = c;
      }
    }
  }

  // Extract comments
  lines.forEach(row => {
    if (row[textColIdx] && row[textColIdx].trim()) {
      comments.push(row[textColIdx].trim());
    }
  });

  return comments;
}

function handleCSVFile(file) {
  if (!file) return;
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    alert('Please upload a valid CSV file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const comments = parseCSVText(text);
    if (comments.length === 0) {
      alert('Could not find any readable comments in the uploaded CSV.');
      return;
    }

    // Populate input textarea and run analysis
    document.getElementById('demoTextarea').value = comments.join('\n');
    document.getElementById('charCount').textContent = `${comments.length} comment${comments.length !== 1 ? 's' : ''} parsed from CSV`;
    
    // Auto-trigger progress loader
    goScreen('processing');
  };
  reader.readAsText(file);
}

// 10. Visual Theme System & Sync
function initTheme() {
  const toggleBtn = document.querySelector('.theme-btn');
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem('sentix_theme') || 'light';
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    toggleBtn.innerHTML = '<i class="ti ti-sun" aria-hidden="true"></i>';
    toggleBtn.setAttribute('aria-label', 'Switch to Light Theme');
  } else {
    document.body.classList.remove('dark-theme');
    toggleBtn.innerHTML = '<i class="ti ti-moon" aria-hidden="true"></i>';
    toggleBtn.setAttribute('aria-label', 'Switch to Dark Theme');
  }
}

function toggleTheme() {
  const toggleBtn = document.querySelector('.theme-btn');
  const isDark = document.body.classList.toggle('dark-theme');

  if (isDark) {
    localStorage.setItem('sentix_theme', 'dark');
    toggleBtn.innerHTML = '<i class="ti ti-sun" aria-hidden="true"></i>';
    toggleBtn.setAttribute('aria-label', 'Switch to Light Theme');
    showToast('Switched to Dark Theme.');
  } else {
    localStorage.setItem('sentix_theme', 'light');
    toggleBtn.innerHTML = '<i class="ti ti-moon" aria-hidden="true"></i>';
    toggleBtn.setAttribute('aria-label', 'Switch to Dark Theme');
    showToast('Switched to Light Theme.');
  }
  
  // Re-draw results charts to match updated theme variables
  if (currentScreen === 'results') {
    initResultsScreen();
  }
}

// 11. Toast Notifications
function showToast(message) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.querySelector('span').textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// 12. Keyboard Shortcuts Handler
function handleKeyboardShortcuts(event) {
  const isCmdOrCtrl = event.metaKey || event.ctrlKey;
  
  // 1. Analyze: Ctrl/Cmd + Enter
  if (isCmdOrCtrl && event.key === 'Enter') {
    if (currentScreen === 'input') {
      event.preventDefault();
      goScreen('processing');
    }
  }

  // 2. Export CSV: Ctrl/Cmd + E
  if (isCmdOrCtrl && event.key.toLowerCase() === 'e') {
    if (currentScreen === 'results') {
      event.preventDefault();
      exportResultsToCSV();
    }
  }

  // 3. Clear Input: Ctrl/Cmd + Backspace
  if (isCmdOrCtrl && (event.key === 'Backspace' || event.key === 'Delete')) {
    if (currentScreen === 'input') {
      const ta = document.getElementById('demoTextarea');
      if (document.activeElement === ta || confirm('Clear all textarea input?')) {
        ta.value = '';
        ta.dispatchEvent(new Event('input'));
        showToast('Text input cleared.');
      }
    }
  }

  // 4. New Analysis: Ctrl/Cmd + N
  if (isCmdOrCtrl && event.key.toLowerCase() === 'n') {
    if (['results', 'detail', 'history'].includes(currentScreen)) {
      event.preventDefault();
      goScreen('input');
    }
  }
}

// 13. DOM Bindings Setup
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Bind
  initTheme();
  const themeBtn = document.querySelector('.topnav .theme-btn');
  if (themeBtn) {
    themeBtn.setAttribute('onclick', ''); // strip mockup inline alert
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Keyboard events
  window.addEventListener('keydown', handleKeyboardShortcuts);

  // File Upload Bindings
  const dropZone = document.querySelector('.drop-zone');
  if (dropZone) {
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
    dropZone.appendChild(fileInput);

    // Clicking drop zone triggers file selector
    dropZone.addEventListener('click', () => fileInput.click());
    
    // Listen for drop input select
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      handleCSVFile(file);
    });

    // Handle Drag & Drop events
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.background = 'var(--color-accent-light)';
      dropZone.style.borderColor = 'var(--color-accent)';
    });

    ['dragleave', 'dragend'].forEach(evt => {
      dropZone.addEventListener(evt, () => {
        dropZone.style.background = '';
        dropZone.style.borderColor = '';
      });
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.background = '';
      dropZone.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      handleCSVFile(file);
    });

    // Keyboard support for Drop Zone (A11y)
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  }

  // Flag Button action simulation
  const flagBtn = document.querySelector('.flag-btn');
  if (flagBtn) {
    flagBtn.addEventListener('click', () => {
      flagBtn.classList.toggle('flagged');
      if (flagBtn.classList.contains('flagged')) {
        flagBtn.style.background = 'var(--color-danger-light)';
        flagBtn.style.color = 'var(--color-danger)';
        showToast('Comment flagged for manual review.');
      } else {
        flagBtn.style.background = '';
        flagBtn.style.color = '';
        showToast('Flag removed.');
      }
    });
  }

  // Textarea input counters
  const demoTextarea = document.getElementById('demoTextarea');
  if (demoTextarea) {
    demoTextarea.addEventListener('input', () => {
      const lines = demoTextarea.value.split('\n').filter(line => line.trim().length > 0).length;
      document.getElementById('charCount').textContent = `${lines} comment${lines !== 1 ? 's' : ''} detected`;
    });
  }

  // Direct script bindings for demo
  const mainAnalyzeBtn = document.querySelector('#screen-input .btn-primary');
  if (mainAnalyzeBtn) {
    mainAnalyzeBtn.setAttribute('onclick', ''); // strip mock inline
    mainAnalyzeBtn.addEventListener('click', () => goScreen('processing'));
  }

  // Setup navigation
  goScreen('empty');
});

// Export for Node/Jest testing environment
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    goScreen,
    runAnalysisOnText,
    overrideSentiment,
    getHistory,
    saveBatchToHistory,
    deleteBatch,
    exportResultsToCSV,
    parseCSVText,
    currentBatchData,
    currentScreen
  };
}
