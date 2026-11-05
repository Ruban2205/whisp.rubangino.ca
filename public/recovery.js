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
  window.addEventListener('error', event => {
    if (ready) return;
    const target = event.target;
    if (target instanceof HTMLScriptElement || (target instanceof HTMLLinkElement && target.rel === 'stylesheet') || event instanceof ErrorEvent) fail();
  }, true);
  window.addEventListener('unhandledrejection', () => { if (!ready) fail(); });
  document.addEventListener('DOMContentLoaded', () => { if (failed) reveal(); });
})();
