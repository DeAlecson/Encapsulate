/* =========================================================
   app.js — Main entry point for Encapsulate
   ========================================================= */

const App = (() => {
  const { $ } = Utils;

  const init = () => {
    // 1. Initialise storage (creates defaults on first run)
    Storage.init();

    // 2. Apply saved visual settings
    Settings.applyAll();

    // 3. Register routes
    Router.register('/',         Renderer.dashboard);
    Router.register('/units',    (params) => {
      if (params && params.length > 0) {
        Renderer.unitDetail(params);
      } else {
        Renderer.unitsList();
      }
    });
    Router.register('/skillmap', Renderer.skillMap);
    Router.register('/quiz',     Renderer.quiz);
    Router.register('/practice', Renderer.practice);
    Router.register('/mock',     Renderer.mock);
    Router.register('/review',   Renderer.reviewVault);
    Router.register('/ai',       Renderer.aiStudio);

    // 4. Start router
    Router.init();

    // 5. Update gamification header
    Gamification.checkStreak();
    Gamification.refreshHeader();

    // 6. Bind global UI events
    bindGlobalEvents();

    // 7. Register service worker
    registerSW();

    console.log('Encapsulate v' + Storage.VERSION + ' initialised');
  };

  const bindGlobalEvents = () => {
    // Settings toggle
    const settingsBtn = $('#settings-toggle');
    if (settingsBtn) settingsBtn.onclick = Settings.toggle;

    // Close settings
    const closeBtn = $('#settings-close');
    if (closeBtn) closeBtn.onclick = Settings.close;

    // Close dialog when clicking the backdrop (native dialog fires click on the dialog element itself)
    const settingsDialog = $('#settings-panel');
    if (settingsDialog) {
      settingsDialog.addEventListener('click', (e) => {
        // If the click target is the dialog itself (not a child), it means the backdrop was clicked
        if (e.target === settingsDialog) {
          Settings.close();
        }
      });
      // Close on Escape is handled natively by <dialog>, but also handle the cancel event
      settingsDialog.addEventListener('cancel', (e) => {
        State.set('settingsOpen', false);
      });
    }

    // Nav toggle (mobile)
    const navToggle = $('#nav-toggle');
    if (navToggle) navToggle.onclick = () => {
      const nav = $('#side-nav');
      if (nav) nav.classList.toggle('nav--open');
    };

    // Nav links
    document.querySelectorAll('.nav__link').forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        Router.navigate(link.dataset.route);
        // Close mobile nav
        const nav = $('#side-nav');
        if (nav) nav.classList.remove('nav--open');
      };
    });

    // Close nav on clicking main content (mobile)
    const mainContent = $('#main-content');
    if (mainContent) mainContent.addEventListener('click', () => {
      const nav = $('#side-nav');
      if (nav) nav.classList.remove('nav--open');
    });

    // Keyboard: Escape closes settings
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (State.get('settingsOpen')) Settings.close();
      }
    });
  };

  const registerSW = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('SW registered'))
        .catch(e => console.warn('SW registration failed', e));
    }
  };

  return { init };
})();

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', App.init);
