/* =========================================================
   state.js — Lightweight reactive state for Encapsulate
   Holds runtime state (not persisted, just in-memory)
   ========================================================= */

const State = (() => {
  let _state = {
    settingsOpen: false,
    navOpen: false,
    currentView: 'dashboard',
    loading: false,
    toastQueue: [],
    apiKeyActive: false
  };

  const listeners = new Set();

  const get = (key) => key ? _state[key] : { ..._state };

  const set = (key, val) => {
    _state[key] = val;
    notify();
  };

  const merge = (partial) => {
    Object.assign(_state, partial);
    notify();
  };

  const subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };

  const notify = () => {
    for (const fn of listeners) {
      try { fn({ ..._state }); } catch (e) { console.error('State listener error', e); }
    }
  };

  return { get, set, merge, subscribe };
})();
