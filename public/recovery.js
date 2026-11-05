/* Tiny bootstrap fallback: no storage, telemetry, text capture, or automatic reload. */
(() => {
  let ready = false, failed = false;
  const reveal = () => {
    const panel = document.getElementById('startup-error');
    if (!panel) return;
    const root = document.getElementById('root');
    if (root) root.hidden = true;
    panel.hidden = false;
    const heading = panel.querySelector('h2');
    if (heading) { heading.tabIndex = -1; heading.focus(); }
  };
  const fail = () => { failed = true; reveal(); };
  window.addEventListener('whisp:ready', () => { ready = true; });
  window.addEventListener('whisp:root-error', fail);
  const sameOrigin = value => {
    try { return Boolean(value) && new URL(value, location.href).origin === location.origin; }
    catch { return false; }
  };
  window.addEventListener('error', event => {
    if (ready) return;
    const target = event.target;
    // Hosts/extensions may inject optional resources. A blocked external script
    // must not hide a healthy app or require weakening its privacy policy.
    const appScript = target instanceof HTMLScriptElement && target.type === 'module' && sameOrigin(target.src);
    const appStyle = target instanceof HTMLLinkElement && target.rel === 'stylesheet' && sameOrigin(target.href);
    const appError = event instanceof ErrorEvent && sameOrigin(event.filename);
    if (appScript || appStyle || appError) fail();
  }, true);
  window.addEventListener('unhandledrejection', () => { if (!ready) fail(); });
  document.addEventListener('DOMContentLoaded', () => { if (failed) reveal(); });
})();
