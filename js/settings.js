/* =========================================================
   settings.js — Settings panel for Encapsulate
   API key, theme, strictness, font size, import/export
   ========================================================= */

const Settings = (() => {
  const { $, $$, el, toast, STRICTNESS } = Utils;

  const open = () => {
    const overlay = $('#settings-overlay');
    if (overlay) {
      overlay.classList.add('settings-overlay--open');
      State.set('settingsOpen', true);
      render();
    }
  };

  const close = () => {
    const overlay = $('#settings-overlay');
    if (overlay) {
      overlay.classList.remove('settings-overlay--open');
      State.set('settingsOpen', false);
    }
  };

  const toggle = () => {
    State.get('settingsOpen') ? close() : open();
  };

  /* ---------- render settings content ---------- */
  const render = () => {
    const container = $('#settings-content');
    if (!container) return;

    const s = Storage.getSettings();
    const hasKey = !!Storage.getApiKey();

    container.innerHTML = `
      <!-- API Key -->
      <section class="settings-group">
        <h3 class="settings-group__title">AI Marking</h3>
        <div class="settings-row">
          <label class="settings-label" for="api-key-input">Anthropic API Key</label>
          <div class="api-key-row">
            <input
              type="password"
              id="api-key-input"
              class="settings-input settings-input--mono"
              placeholder="sk-ant-..."
              autocomplete="off"
              spellcheck="false"
              autocorrect="off"
              autocapitalize="off"
            />
            <button class="btn btn--small btn--ghost" id="api-key-toggle" title="Show/hide key" type="button">
              👁
            </button>
          </div>
          <p class="settings-hint">Stored in sessionStorage only. Cleared on tab close.</p>
          <div class="settings-row__actions">
            <button class="btn btn--small btn--primary" id="api-key-save" type="button">Save key</button>
            <button class="btn btn--small btn--danger" id="api-key-clear" type="button" ${!hasKey ? 'disabled' : ''}>Clear key</button>
            <button class="btn btn--small btn--secondary" id="api-key-test" type="button" ${!hasKey ? 'disabled' : ''}>Test connection</button>
          </div>
          <div class="api-status-panel" id="api-status-panel">
            ${renderApiStatus()}
          </div>
        </div>
      </section>

      <!-- Strictness -->
      <section class="settings-group">
        <h3 class="settings-group__title">Marking Strictness</h3>
        <div class="strictness-grid">
          ${Object.entries(STRICTNESS).map(([key, val]) => `
            <button class="strictness-card ${s.strictness === key ? 'strictness-card--active' : ''}" data-strict="${key}">
              <span class="strictness-card__icon">${val.icon}</span>
              <span class="strictness-card__label">${val.label}</span>
              <span class="strictness-card__desc">${val.desc}</span>
            </button>
          `).join('')}
        </div>
      </section>

      <!-- Theme -->
      <section class="settings-group">
        <h3 class="settings-group__title">Appearance</h3>
        <div class="settings-row">
          <label class="settings-label">Theme</label>
          <div class="toggle-group">
            <button class="toggle-btn ${s.theme === 'dark' ? 'toggle-btn--active' : ''}" data-theme="dark">Dark</button>
            <button class="toggle-btn ${s.theme === 'light' ? 'toggle-btn--active' : ''}" data-theme="light">Light</button>
          </div>
        </div>
        <div class="settings-row">
          <label class="settings-label">Font Size</label>
          <div class="toggle-group">
            <button class="toggle-btn ${s.fontSize === 'small' ? 'toggle-btn--active' : ''}" data-fontsize="small">S</button>
            <button class="toggle-btn ${s.fontSize === 'medium' ? 'toggle-btn--active' : ''}" data-fontsize="medium">M</button>
            <button class="toggle-btn ${s.fontSize === 'large' ? 'toggle-btn--active' : ''}" data-fontsize="large">L</button>
          </div>
        </div>
        <div class="settings-row">
          <label class="settings-label">Reduced Motion</label>
          <label class="switch">
            <input type="checkbox" id="reduced-motion" ${s.reducedMotion ? 'checked' : ''}>
            <span class="switch__slider"></span>
          </label>
        </div>
      </section>

      <!-- Learning Mode -->
      <section class="settings-group">
        <h3 class="settings-group__title">Learning Mode</h3>
        <div class="toggle-group">
          <button class="toggle-btn ${s.mode === 'guided' ? 'toggle-btn--active' : ''}" data-mode="guided">
            🗺️ Guided Path
          </button>
          <button class="toggle-btn ${s.mode === 'explore' ? 'toggle-btn--active' : ''}" data-mode="explore">
            🔍 Free Explore
          </button>
        </div>
      </section>

      <!-- Data -->
      <section class="settings-group">
        <h3 class="settings-group__title">Data</h3>
        <div class="settings-row__actions">
          <button class="btn btn--small btn--secondary" id="export-btn">Export progress</button>
          <label class="btn btn--small btn--secondary" id="import-label">
            Import progress
            <input type="file" id="import-input" accept=".json" hidden>
          </label>
        </div>
        <div class="settings-row__actions" style="margin-top:0.75rem">
          <button class="btn btn--small btn--danger" id="reset-btn">Reset all data</button>
        </div>
      </section>
    `;

    bindEvents();
  };

  /* ---------- bind events ---------- */
  const bindEvents = () => {
    const keyInput = $('#api-key-input');
    const keyToggle = $('#api-key-toggle');
    const keySave = $('#api-key-save');
    const keyClear = $('#api-key-clear');

    // Set value via JS property (not HTML attribute)
    if (keyInput) {
      keyInput.value = Storage.getApiKey();
    }

    if (keyToggle) keyToggle.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    };

    if (keySave) keySave.onclick = () => {
      const val = keyInput.value.trim();
      if (val) {
        Storage.setApiKey(val);
        State.set('apiKeyActive', true);
        toast('API key saved for this session', 'success');
      } else {
        toast('Please enter a key', 'warn');
      }
      render();
    };

    if (keyClear) keyClear.onclick = () => {
      Storage.clearApiKey();
      State.set('apiKeyActive', false);
      toast('API key cleared', 'info');
      render();
    };

    // Test connection
    const keyTest = $('#api-key-test');
    if (keyTest) keyTest.onclick = async () => {
      keyTest.disabled = true;
      keyTest.textContent = 'Testing...';
      const statusPanel = $('#api-status-panel');
      try {
        await AI.request('You are a test. Reply with exactly: {"ok":true}', 'Test connection. Reply with {"ok":true}');
        State.set('apiKeyActive', true);
        if (statusPanel) statusPanel.innerHTML = renderApiStatus('ready');
        toast('Connection successful!', 'success');
      } catch (err) {
        if (statusPanel) statusPanel.innerHTML = renderApiStatus('error', AI.getLastError());
        toast(MarkingService.getFriendlyError(err.message), 'error');
      }
      keyTest.disabled = false;
      keyTest.textContent = 'Test connection';
    };

    // Strictness
    $$('.strictness-card').forEach(btn => {
      btn.onclick = () => {
        Storage.updateSettings(s => s.strictness = btn.dataset.strict);
        toast(`Strictness: ${STRICTNESS[btn.dataset.strict].label}`, 'info');
        render();
      };
    });

    // Theme
    $$('[data-theme]').forEach(btn => {
      btn.onclick = () => {
        Storage.updateSettings(s => s.theme = btn.dataset.theme);
        applyTheme(btn.dataset.theme);
        render();
      };
    });

    // Font size
    $$('[data-fontsize]').forEach(btn => {
      btn.onclick = () => {
        Storage.updateSettings(s => s.fontSize = btn.dataset.fontsize);
        applyFontSize(btn.dataset.fontsize);
        render();
      };
    });

    // Reduced motion
    const rmInput = $('#reduced-motion');
    if (rmInput) rmInput.onchange = () => {
      Storage.updateSettings(s => s.reducedMotion = rmInput.checked);
      applyReducedMotion(rmInput.checked);
    };

    // Learning mode
    $$('[data-mode]').forEach(btn => {
      btn.onclick = () => {
        Storage.updateSettings(s => s.mode = btn.dataset.mode);
        toast(`Mode: ${btn.dataset.mode === 'guided' ? 'Guided Path' : 'Free Explore'}`, 'info');
        render();
      };
    });

    // Export
    const exportBtn = $('#export-btn');
    if (exportBtn) exportBtn.onclick = () => {
      const data = Storage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `encapsulate-progress-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Progress exported', 'success');
    };

    // Import
    const importInput = $('#import-input');
    if (importInput) importInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          Storage.importData(json);
          toast('Progress imported! Reloading...', 'success');
          setTimeout(() => location.reload(), 1000);
        } catch (err) {
          toast('Invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    };

    // Reset
    const resetBtn = $('#reset-btn');
    if (resetBtn) resetBtn.onclick = () => {
      if (confirm('This will permanently erase all progress, settings, and saved data. Continue?')) {
        Storage.resetAll();
        toast('All data reset. Reloading...', 'info');
        setTimeout(() => location.reload(), 1000);
      }
    };
  };

  /* ---------- apply visual settings ---------- */
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  const applyFontSize = (size) => {
    document.documentElement.setAttribute('data-fontsize', size);
  };

  const applyReducedMotion = (on) => {
    document.documentElement.classList.toggle('reduced-motion', on);
  };

  const applyAll = () => {
    const s = Storage.getSettings();
    applyTheme(s.theme);
    applyFontSize(s.fontSize);
    applyReducedMotion(s.reducedMotion);
    State.set('apiKeyActive', !!Storage.getApiKey());
  };

  /* ---------- API status indicator ---------- */
  const renderApiStatus = (overrideStatus, errorMsg) => {
    const hasKey = !!Storage.getApiKey();
    const online = navigator.onLine;
    let status = overrideStatus || (hasKey ? (online ? 'ready' : 'offline') : 'none');

    const states = {
      none:    { cls: 'api-status--none',    icon: '○', text: 'No API key set — using offline marking' },
      ready:   { cls: 'api-status--ready',   icon: '●', text: 'AI marking ready' },
      offline: { cls: 'api-status--offline',  icon: '◐', text: 'Offline — AI marking will use fallback' },
      error:   { cls: 'api-status--error',   icon: '✗', text: errorMsg || AI.getLastError() || 'API error' },
      loading: { cls: 'api-status--loading',  icon: '◌', text: 'Connecting...' }
    };

    const s = states[status] || states.none;
    return `<div class="api-status ${s.cls}">${s.icon} ${s.text}</div>`;
  };

  return { open, close, toggle, render, applyAll };
})();
