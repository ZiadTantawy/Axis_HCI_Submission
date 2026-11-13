'use strict';
/* Start-up: read #role/screen from the URL so any screen can be opened directly. */
(function init() {
  const m = (location.hash || '').replace('#', '').split('/');
  if (SCREENS[m[0]]) {
    S.role = m[0];
    if (m[1] && SCREENS[m[0]][m[1]]) S.screen[m[0]] = m[1];
  }
  render(false);
})();
