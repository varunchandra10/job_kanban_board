// Global fetch interceptor to inject Authorization header for multi-user support
(function() {
  if (window.__fetchAuthInjected) return;
  window.__fetchAuthInjected = true;
  const _origFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const token = localStorage.getItem('auth_token');
    if (token && typeof url === 'string' && (url.startsWith('/api') || url.includes('/api/'))) {
      options.headers = options.headers || {};
      if (options.headers instanceof Headers) {
        if (!options.headers.has('Authorization')) {
          options.headers.set('Authorization', 'Bearer ' + token);
        }
      } else if (Array.isArray(options.headers)) {
        if (!options.headers.some(([k]) => k.toLowerCase() === 'authorization')) {
          options.headers.push(['Authorization', 'Bearer ' + token]);
        }
      } else {
        if (!options.headers['Authorization'] && !options.headers['authorization']) {
          options.headers['Authorization'] = 'Bearer ' + token;
        }
      }
    }
    return _origFetch.call(this, url, options);
  };
})();

