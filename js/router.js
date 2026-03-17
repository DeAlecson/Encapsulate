/* =========================================================
   router.js — Hash-based SPA router for Encapsulate
   ========================================================= */

const Router = (() => {
  const routes = {};
  let currentRoute = null;
  let beforeHooks = [];

  const register = (path, handler) => {
    routes[path] = handler;
  };

  const onBefore = (fn) => {
    beforeHooks.push(fn);
  };

  const navigate = (path) => {
    window.location.hash = path;
  };

  const resolve = () => {
    const hash = window.location.hash.slice(1) || '/';
    const [path, ...paramParts] = hash.split('/').filter(Boolean);
    const route = '/' + (path || '');
    const params = paramParts;

    // Run before hooks (e.g. save in-progress state)
    for (const hook of beforeHooks) {
      hook(currentRoute, route);
    }

    currentRoute = route;

    // Try exact match first
    if (routes[route]) {
      routes[route](params);
      return;
    }

    // Try with params
    const fullPath = '/' + hash.replace(/^\//, '');
    if (routes[fullPath]) {
      routes[fullPath](params);
      return;
    }

    // Fallback to dashboard
    if (routes['/']) {
      routes['/'](params);
    }
  };

  const init = () => {
    window.addEventListener('hashchange', resolve);
    resolve();
  };

  const getCurrent = () => currentRoute;

  return { register, navigate, init, resolve, getCurrent, onBefore };
})();
