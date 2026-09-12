/* Sets the theme before first paint.
 *
 * An external file rather than an inline <script> on purpose: the site ships
 * `script-src 'self'` with no 'unsafe-inline', so an inline block is refused
 * outright — which showed up as a full-brightness paper flash for every
 * night-mode visitor on the production build while dev looked perfectly fine.
 *
 * Loaded without defer/async so it runs before the document is painted. That
 * is the whole job; it is a few hundred bytes from the same origin.
 *
 * An explicit stored choice wins. Absent one, follow the operating system,
 * and keep following it — nothing is persisted until the reader actually
 * presses the toggle.
 */
(function () {
  try {
    var stored = localStorage.getItem("hianzy-theme");
    var dark =
      stored === "dark" ||
      (!stored &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");

    if (dark) {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", "#121717");
    }
  } catch (e) {
    /* private mode, or storage disabled — daylight is the safe default */
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
