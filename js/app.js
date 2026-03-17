/* =========================================================
   app.js — Main entry point for Encapsulate
   ========================================================= */

const App = (() => {
  const { $ } = Utils;

  const init = () => {
    Storage.init();
    Settings.applyAll();

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

    Router.init();

    Gamification.checkStreak();
    Gamification.refreshHeader();

    bindGlobalEvents();
    registerSW();

    console.log('Encapsulate v' + Storage.VERSION + ' initialised');
  };

  const bindGlobalEvents = () => {
    // Settings toggle
    const settingsBtn = $('#settings-toggle');
    if (settingsBtn) settingsBtn.onclick = Settings.toggle;

    // Settings close button
    const closeBtn = $('#settings-close');
    if (closeBtn) closeBtn.onclick = Settings.close;

    // Close settings when clicking the OVERLAY (dark area), NOT the panel
    // e.target === overlay means the click landed on the dark background itself
    // e.target === child means the click landed inside the panel — do nothing
    const overlay = $('#settings-overlay');
    if (overlay) {
      overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) {
          Settings.close();
        }
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

document.addEventListener('DOMContentLoaded', App.init);
